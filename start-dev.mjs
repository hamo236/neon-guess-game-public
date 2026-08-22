import { createServer } from 'vite';

async function main() {
  const server = await createServer({
    server: { host: true }
  });
  await server.listen();
  server.printUrls();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
