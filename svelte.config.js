import adapter from '@sveltejs/adapter-cloudflare';

export default {
  kit: {
    adapter: adapter({
      config: './wrangler.jsonc',
      fallback: 'plaintext',
      routes: {
        include: ['/*'],
        exclude: ['<all>']
      }
    })
  }
};
