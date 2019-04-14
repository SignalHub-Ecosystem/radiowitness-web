# rw-web
Publisher homepage generator.

```
$ ./bin/radiowitness wss --core dat://studio.key --db dat://db.key
$ ./bin/radiowitness json dat://studio.key wss://cool.pub.peer > web/dat.json
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
