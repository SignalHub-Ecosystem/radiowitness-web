# rw-web
Publisher homepage and project documentation.

```
$ ./bin/radiowitness wss dat://studio.key
$ ./bin/radiowitness web dat://studio.key wss://cool.pub.peer > web/dat.json
$ npm run build --prefix web/
```

## Commands
Command                | Description                                      |
-----------------------|--------------------------------------------------|
`$ npm start`          | Start the development server
`$ npm test`           | Lint, validate deps & run tests
`$ npm run build`      | Compile all files into `dist/`
`$ npm run create`     | Generate a scaffold file
`$ npm run inspect`    | Inspect the bundle's dependencies
