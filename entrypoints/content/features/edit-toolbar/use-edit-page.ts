import { useQuery } from '@tanstack/react-query';
import ky from 'ky';
import { useEffect, useState } from 'react';

import useHikka, { HIKKA_API } from '@/hooks/use-hikka';
import useLocationPath from '@/hooks/use-location-path';

import { EDIT_FORM_PATH } from '../../core/core.constant';
import { queryClient } from '../../core/query-client';
import { checkField, type FieldIssue } from './edit-checks';
import { type EditField, readEditFields } from './edit-fields';

/** A new edit, an edit as it was sent, or an edit its author is changing. */
export type EditPageMode = 'new' | 'view' | 'update';

/** Which edit page this is, by its path. */
export const useEditPage = () => {
  const match = useLocationPath().match(EDIT_FORM_PATH);
  if (!match) return undefined;
  const editId = match[1] ? Number(match[1]) : undefined;
  const mode: EditPageMode = !editId ? 'new' : match[2] ? 'update' : 'view';
  return { mode, editId };
};

/**
 * The content the page edits. A new edit's page loads it; an edit's page
 * loads the edit, which holds it.
 */
export const useEditedContent = () => {
  const { data } = useHikka();
  const content = data?.edit_id ? data.content : data;
  return {
    content,
    type: content?.data_type as string | undefined,
  };
};

export interface CheckedEditField extends EditField {
  issues: FieldIssue[];
}

/** The form's open fields and what each breaks, as they're edited. */
export const useEditFields = () => {
  const [fields, setFields] = useState<CheckedEditField[]>([]);

  useEffect(() => {
    let timeout = 0;
    const update = () =>
      setFields(
        readEditFields().map((field) => ({
          ...field,
          issues: checkField(field),
        })),
      );
    // Typing and the site's re-renders change the page a lot at once.
    const schedule = () => {
      clearTimeout(timeout);
      timeout = window.setTimeout(update, 150);
    };
    update();

    const observer = new MutationObserver(schedule);
    observer.observe(document.querySelector('main') ?? document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-open'],
    });
    // A typed value changes no attribute.
    document.addEventListener('input', schedule, true);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      document.removeEventListener('input', schedule, true);
    };
  }, []);

  return fields;
};

/** The username signed in to hikka.io, for signing one's own description. */
export const useHikkaUsername = () =>
  useQuery({
    queryKey: ['hikka-viewer-username'],
    queryFn: () =>
      ky
        .get(`${HIKKA_API}/user/me`, { credentials: 'include', retry: 0 })
        .json<{ username?: string }>()
        .then(({ username }) => username ?? null),
    retry: false,
    staleTime: Infinity,
  }).data;

/** The largest page hikka.io's edit list serves. */
const PENDING_PAGE_SIZE = 100;

/** A page of the pending edits, newest first. */
const pendingPage = (page: number) =>
  queryClient.fetchQuery({
    queryKey: ['pending-edits', page],
    queryFn: () =>
      ky
        .post(`${HIKKA_API}/edit/list`, {
          searchParams: { page, size: PENDING_PAGE_SIZE },
          json: { status: 'pending', sort: ['edit_id:desc'] },
        })
        .json<{
          pagination: { pages: number };
          list: { edit_id: number }[];
        }>(),
    staleTime: 30_000,
  });

type PendingEdit = { edit_id: number };

/**
 * The pending edits right before and after `editId` by number. hikka.io
 * can't list from a number on, so the pages are searched halfway each time
 * for the first that goes below it: a few requests, however long the queue.
 */
async function searchPendingNeighbours(editId: number) {
  const reachesBelow = (list: PendingEdit[]) =>
    (list.at(-1)?.edit_id ?? Infinity) < editId;

  const first = await pendingPage(1);
  const pages = first.pagination.pages;
  // Past the last page when every pending edit is at or above `editId`.
  let page = pages + 1;
  let list: PendingEdit[] = [];
  if (reachesBelow(first.list)) {
    page = 1;
    list = first.list;
  } else {
    for (let low = 2, high = pages; low <= high;) {
      const middle = Math.floor((low + high) / 2);
      const { list: middleList } = await pendingPage(middle);
      if (reachesBelow(middleList)) {
        page = middle;
        list = middleList;
        high = middle - 1;
      } else {
        low = middle + 1;
      }
    }
  }

  const index = list.findIndex(({ edit_id }) => edit_id < editId);
  const previous = list[index]?.edit_id;
  // The next is the last above `editId`: on this page before the previous,
  // or at the end of the page before, which is all at or above it.
  let candidates = index < 0 ? list : list.slice(0, index);
  for (let before = page - 1; ; before--) {
    const next = candidates.findLast(({ edit_id }) => edit_id > editId);
    if (next || before < 1) return { previous, next: next?.edit_id };
    candidates = (await pendingPage(before)).list;
  }
}

/**
 * The pending edit right before or after `editId` by number; undefined when
 * there's none. Both directions share one search.
 */
export const findPendingEdit = async (
  editId: number,
  direction: 'previous' | 'next',
) =>
  (
    await queryClient.fetchQuery({
      queryKey: ['pending-neighbours', editId],
      queryFn: () => searchPendingNeighbours(editId),
      staleTime: 30_000,
    })
  )[direction];
