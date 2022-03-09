// Copyright (C) 2021 AuthTS Contributors
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { DateUtils } from "./utils";

/**
 * A clock service (and accompanying server side time API) is required for large scale applications as incorrect user
 * clocks are not uncommon. When the clock is incorrectly set on the client, the user is unable to sign in and there
 * are no server side errors to indicate that there may be a problem.
 * Examples where clock skew occurs due to an incorrect client side clock, where the clock is still "correct" in terms
 * of wall clock time:
 * - Incorrect DST settings
 * - Incorrect timezone settings
 * - Incorrect 12 hour clock (AM/PM switched by user error)
 *
 * @public
 */
export interface IClockService {
    getEpochTime(): Promise<number> | number;
}

/**
 * Default implementation using `Math.floor(Date.now() / 1000)`
 *
 * @internal
 */
export class ClockService implements IClockService {
    public getEpochTime(): Promise<number> | number {
        return DateUtils.getEpochTime();
    }
}
