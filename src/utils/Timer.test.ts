// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Timer } from "./Timer";
import type { IClockService } from "../ClockService";

describe("Timer", () => {
    let clockService: StubClockService;
    let subject: Timer;

    beforeEach(() => {
        clockService = new StubClockService();
        subject = new Timer("test name", clockService);
        jest.useFakeTimers();
        jest.spyOn(globalThis, "clearInterval");
        jest.spyOn(globalThis, "setInterval");
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe("init", () => {

        it("should setup a timer", async () => {
            // act
            await subject.init(10);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));
        });

        it("should use 1 second if duration is too low", async () => {
            // act
            await subject.init(0);

            // assert
            expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1000);

            // act
            await subject.init(-1);
            // assert
            expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1000);

            // act
            await subject.init(-5);

            // assert
            expect(setInterval).toHaveBeenLastCalledWith(expect.any(Function), 1000);
        });

        it("should use duration if less than default", async () => {
            // act
            await subject.init(2);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 2000);
        });

        it("should cancel previous timer if new time is not the same", async () => {
            // act
            await subject.init(10);

            // assert
            expect(clearInterval).not.toHaveBeenCalled();

            // act
            clockService.now += 1;
            await subject.init(10);

            // assert
            expect(clearInterval).toHaveBeenCalled();
        });

        it("should not cancel previous timer if new time is same", async () => {
            // act
            await subject.init(10);

            // assert
            expect(clearInterval).not.toHaveBeenCalled();

            // act
            await subject.init(10);

            // assert
            expect(clearInterval).not.toHaveBeenCalled();
        });
    });

    describe("_callback", () => {

        it("should fire when timer expires", async () => {
            // arrange
            const cb = jest.fn();
            subject.addHandler(cb);

            await subject.init(10);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));

            // act
            clockService.now += 9;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toBeCalledTimes(0);

            // act
            clockService.now += 1;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toBeCalledTimes(1);
        });

        it("should fire if timer late", async () => {
            // arrange
            const cb = jest.fn();
            subject.addHandler(cb);

            await subject.init(10);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));

            clockService.now += 9;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toBeCalledTimes(0);

            clockService.now += 2;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toBeCalledTimes(1);
        });

        it("should cancel window timer", async () => {
            // arrange
            await subject.init(10);

            // assert
            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), expect.any(Number));

            clockService.now += 10;
            jest.runOnlyPendingTimers();

            // assert
            expect(clearInterval).toHaveBeenCalled();
        });
    });

    describe("cancel", () => {

        it("should cancel timer", async () => {
            // act
            await subject.init(10);

            // assert
            expect(clearInterval).not.toHaveBeenCalled();

            // act
            subject.cancel();

            // assert
            expect(clearInterval).toHaveBeenCalled();
        });

        it("should do nothing if no existing timer", () => {
            // act
            subject.cancel();

            // assert
            expect(clearInterval).not.toHaveBeenCalled();
        });
    });

    describe("addHandler", () => {

        it("should allow callback to be invoked", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            await subject.init(10);
            clockService.now += 10;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toBeCalled();
        });

        it("should allow multiple callbacks", async () => {
            // arrange
            const cb = jest.fn();

            // act
            subject.addHandler(cb);
            subject.addHandler(cb);
            subject.addHandler(cb);
            subject.addHandler(cb);
            await subject.init(10);
            clockService.now += 10;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toBeCalledTimes(4);
        });
    });

    describe("removeHandler", () => {

        it("should remove callback from being invoked", async () => {
            // arrange
            const cb = jest.fn();
            subject.addHandler(cb);
            await subject.init(10);

            // act
            subject.removeHandler(cb);
            clockService.now += 10;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb).toBeCalledTimes(0);
        });

        it("should remove individual callback", async () => {
            // arrange
            const cb1 = jest.fn();
            const cb2 = jest.fn();
            subject.addHandler(cb1);
            subject.addHandler(cb2);
            subject.addHandler(cb1);

            // act
            await subject.init(10);
            subject.removeHandler(cb1);
            subject.removeHandler(cb1);
            clockService.now += 10;
            jest.runOnlyPendingTimers();

            // assert
            expect(cb1).toBeCalledTimes(0);
            expect(cb2).toBeCalledTimes(1);
        });
    });
});

class StubClockService implements IClockService {
    public now = 1;
    getEpochTime(): Promise<number> | number {
        return this.now;
    }
}
