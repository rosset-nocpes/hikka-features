import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  name: 'add-rules-json',
  imports: [{ from: '#rules-json', name: '*', as: 'RulesJson' }],
  async setup(wxt) {
    wxt.hook('build:done', (_, output) => {
      output.publicAssets.push({
        type: 'asset',
        fileName: 'rules.json',
      });
    });
  },
});
