const chai = require('chai');
const { newQueue, resolve, reject } = require('./test.data');

describe('promise-queue-timeout', () => {
    const { expect } = chai;

    describe('start()', () => {
        it('should start if the queue is not empty', (done) => {
            const queue = newQueue();

            expect(queue.state).to.equal(0);

            queue.enqueue(resolve);
            queue.on('end', done());
        });

        it('should automatically start the queue', (done) => {
            let queue = newQueue();

            queue.enqueue(resolve);
            queue.on('resolve', () => done());
        });
    });

    describe('stop()', () => {
        it('should stop the queue even if all tasks are not completed', () => {
            const queue = newQueue({ executors: 1, timeout: 1000 });

            queue.enqueue(resolve);
            queue.enqueue(resolve);
            queue.enqueue(resolve);

            queue.on('start', () => {
                queue.stop();
            });

            queue.on('stop', () => {
                expect(queue.backlog.size).to.not.equal(0);
                done();
            });
        });
    });

    describe('enqueue()', () => {
        it('should add a new task if valid', () => {
            const queue = newQueue();

            queue.enqueue(reject);
            queue.enqueue(resolve);

            expect(queue.backlog.size).to.equal(2);
        });

        it('should reject a new task if not valid', () => {
            const queue = newQueue();

            try {
                expect(queue.enqueue(true)).to.throw();
            } catch (err) {
                expect(err).to.be.an.instanceof(Error);
            }
        });
    });

    describe('isEmpty', () => {
        it("should return 'true' when queue is empty", () => {
            const queue = newQueue();

            expect(queue.isEmpty).to.be.true;
        });

        it("should return 'false' when queue is not empty", () => {
            const queue = newQueue();

            queue.enqueue(resolve);
            queue.enqueue(reject);

            expect(queue.isEmpty).to.be.false;
        });
    });

    describe('shouldRun', () => {
        it("should return 'false' when queue is empty", () => {
            const queue = newQueue();

            expect(queue.shouldRun).to.be.false;
        });

        it("should return 'false' when queue is stopped", () => {
            const queue = newQueue();
            queue.stop();
            queue.enqueue(resolve);
            queue.enqueue(resolve);

            let counter = 2;

            queue.on('resolve', () => {
                counter -= 1;
                if (counter === 0) {
                    expect(queue.shouldRun).to.be.false;
                    done();
                }
            });
        });

        it("should return 'true' when queue is not empty and not stopped", () => {
            const queue = newQueue();

            queue.enqueue(resolve);
            queue.enqueue(reject);

            expect(queue.shouldRun).to.be.true;
        });
    });

    describe('on(event, callback)', () => {
        describe('Event: start', () => {
            it("should NOT emit 'start' event when the queue isEmpty", (done) => {
                let queue = newQueue();
                let count = 0;

                queue.on('start', () => {
                    count++;
                });

                if (count > 0) {
                    done(new Error('Started even if empty'));
                } else {
                    done();
                }
            });
        });

        describe('Event: stop', () => {
            it("should emit 'stop' event when the queue is stopped manually", (done) => {
                let queue = newQueue();

                queue.on('stop', done);

                queue.stop();
            });

            it("should emit 'stop' event when the queue finished resolving all tasks", (done) => {
                let queue = newQueue();

                queue.enqueue(resolve);
                queue.enqueue(resolve);
                queue.on('stop', done);
            });
        });

        describe('Event: end', () => {
            it("should emit 'end' event when the queue finished resolving all tasks", (done) => {
                let queue = newQueue();

                queue.enqueue(resolve);
                queue.enqueue(resolve);
                queue.on('end', done);
            });
        });

        describe('Event: next', () => {
            it("should emit 'next' event when the task completes (resolves or rejects)", (done) => {
                let queue = newQueue({ timeout: 5 });
                let count = 0;

                queue.enqueue(resolve);
                queue.enqueue(reject);

                queue.on('next', () => {
                    count += 1;

                    if (count === 2) {
                        done();
                    }
                });
            });

            it("should emit 'next' event on executors eval", (done) => {
                let count = 2;
                let queue = newQueue({ executors: 2 });

                queue.enqueue(reject);
                queue.enqueue(resolve);
                queue.on('next', () => {
                    count -= 1;

                    if (!count) {
                        done();
                    }
                });
            });
        });

        describe('Event: resolve', () => {
            it("should emit 'resolve' event when the task resolve", (done) => {
                let queue = newQueue();

                queue.enqueue(resolve);
                queue.enqueue(reject);

                queue.on('resolve', (message) => {
                    expect(message).to.equal('Success');
                });

                queue.on('end', () => {
                    done();
                });
            });

            it("should emit 'resolve' event on executors eval", (done) => {
                let count = 2;
                let queue = newQueue({ executors: 2, timeout: 10 });

                queue.enqueue(resolve);
                queue.enqueue(resolve);

                queue.on('resolve', () => {
                    count -= 1;

                    if (count === 0) {
                        done();
                    }
                });
            });
        });

        describe('Event: reject', () => {
            it("should emit 'reject' event when the task reject", (done) => {
                let queue = newQueue();

                queue.enqueue(resolve);
                queue.enqueue(reject);

                queue.on('reject', (message) => {
                    expect(message).to.equal('Error');
                });

                queue.on('end', () => {
                    done();
                });
            });

            it("should emit 'reject' event on executors eval", (done) => {
                let count = 2;
                let queue = newQueue({ executors: 2 });

                queue.enqueue(reject);
                queue.enqueue(reject);

                queue.on('reject', () => {
                    count -= 1;

                    if (!count) {
                        done();
                    }
                });
            });
        });
    });
});
