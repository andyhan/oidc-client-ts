// Copyright (C) 2021 AuthTS Contributors
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

/**
 * @internal
 */
export class DateUtils {
    public static getEpochTime(): number {
        return Math.floor(Date.now() / 1000);
    }
}
