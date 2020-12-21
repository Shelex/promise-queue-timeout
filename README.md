# promise-queue-timeout

promise queue with option to limit new task start time with timeout

## Install

-   yarn:

```bash
yarn add @shelex/queue-promise-timeout
```

-   npm:

```bash
npm install @shelex/queue-promise-timeout
```

## Usage

```js
import Queue from '@shelex/queue-promise-timeout';
// const Queue = require("@shelex/queue-promise-timeout")

const runner = new Queue({
    executors: 2,
    timeout: 2000 // ms
});

runner.enqueue(task, 'A'); // starts automatically
runner.enqueue(task, 'B'); // will be started after 2000ms
runner.enqueue(task, 'C'); // will be started when A or B finished, after 2000ms from previous start

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
