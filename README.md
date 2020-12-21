# promise-queue-timeout

![Build][gh-image]
[![version][version-image]][npm-url]  
[![semantic-release][semantic-image]][semantic-url]
[![License][license-image]][license-url]

promise queue with option to limit new task start time with timeout

## Install

-   yarn:

```bash
yarn add @shelex/promise-queue-timeout
```

-   npm:

```bash
npm install @shelex/promise-queue-timeout
```

## Usage

```js
import Queue from '@shelex/promise-queue-timeout';
// const Queue = require("@shelex/promise-queue-timeout")

const runner = new Queue({
    executors: 2,
    timeout: 2000 // ms
});

runner.enqueue(task, 'A'); // starts automatically
runner.enqueue(task, 'B'); // will be started after 2000ms
runner.enqueue(task, 'C'); // will be started when A or B finished, but after 2000ms from previous start

runner.on('resolve', (data) => console.log(data));
runner.on('reject', (error) => console.error(error));

runner.on('end', () =>
    console.log(`queue finished, all enqueued tasks processed`)
);
```

## API

### `const q = Queue({options})`

Constructor. `options` may contain inital values for:

-   `q.executors`, default: 2; number of tasks executed
-   `q.timeout`, default: 1000; number of ms after previous task start time

### `q.enqueue(task, id)`

Add a task to queue which immediately starts processing.  
Task is a function that returns a promise. Id is optional.

### `q.stop()`

Stops the queue and clears tasks backlog. can be resumed with enqueuing new taks.

### `q.next()`

Returns resolved value for next executed task

### `q.on('start')`

queue started tasks processing

### `q.on('end')`

queue processed all tasks

### `q.on('stop')`

queue stopped processing current tasks and cleared backlog

### `q.on('starting_task', (id, remainingTasksCount))`

queue starting task. Callback has task ID and remaining counter for tasks backlog

### `q.on('resolve', value)`

returns value resolved for just executed task

### `q.on('reject', err)`

returns err for rejected promise for just executed task

### `q.on('next')`

queue is selecting next task from backlog

## Motivation

This queue is an attempt to solve issue with parallelizing testing engines which are fighting for shared resources on initialization, so adding a timeout after start would allow to limit such concurrent startup.

## License

Copyright © 2020 Oleksandr Shevtsov <ovr.shevtsov@gmail.com>

This work is free. You can redistribute it and/or modify it under the
terms of the [MIT License](https://opensource.org/licenses/MIT).
See LICENSE for full details.

[npm-url]: https://npmjs.com/package/@shelex/promise-queue-timeout
[gh-image]: https://github.com/Shelex/promise-queue-timeout/workflows/Release/badge.svg?branch=master
[types-path]: ./index.d.ts
[semantic-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-url]: https://github.com/semantic-release/semantic-release
[license-image]: https://img.shields.io/npm/l/@shelex/promise-queue-timeout
[license-url]: https://opensource.org/licenses/MIT
[version-image]: https://badgen.net/npm/v/@shelex/promise-queue-timeout/latest
