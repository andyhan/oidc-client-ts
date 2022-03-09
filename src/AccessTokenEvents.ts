// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { Logger, Timer } from "./utils";
import type { User } from "./User";
import type { IClockService } from "./ClockService";

/**
 * @public
 */
export type AccessTokenCallback = (...ev: unknown[]) => (Promise<void> | void);

/**
 * @public
 */
export class AccessTokenEvents {
    protected readonly _logger = new Logger("AccessTokenEvents");

    private readonly _expiringTimer: Timer;
    private readonly _expiredTimer: Timer;
    private readonly _expiringNotificationTimeInSeconds: number;

    public constructor(args: { expiringNotificationTimeInSeconds: number; clockService: IClockService }) {
        this._expiringTimer = new Timer("Access token expiring", args.clockService);
        this._expiredTimer = new Timer("Access token expired", args.clockService);
        this._expiringNotificationTimeInSeconds = args.expiringNotificationTimeInSeconds;
    }

    public async load(container: User): Promise<void> {
        const logger = this._logger.create("load");
        // only register events if there's an access token and it has an expiration
        if (container.access_token && container.expires_in !== undefined) {
            const duration = container.expires_in;
            logger.debug("access token present, remaining duration:", duration);

            if (duration > 0) {
                // only register expiring if we still have time
                let expiring = duration - this._expiringNotificationTimeInSeconds;
                if (expiring <= 0) {
                    expiring = 1;
                }

                logger.debug("registering expiring timer, raising in", expiring, "seconds");
                await this._expiringTimer.init(expiring);
            }
            else {
                logger.debug("canceling existing expiring timer because we're past expiration.");
                this._expiringTimer.cancel();
            }

            // if it's negative, it will still fire
            const expired = duration + 1;
            logger.debug("registering expired timer, raising in", expired, "seconds");
            await this._expiredTimer.init(expired);
        }
        else {
            this._expiringTimer.cancel();
            this._expiredTimer.cancel();
        }
    }

    public unload(): void {
        this._logger.debug("unload: canceling existing access token timers");
        this._expiringTimer.cancel();
        this._expiredTimer.cancel();
    }

    /**
     * Add callback: Raised prior to the access token expiring.
     */
    public addAccessTokenExpiring(cb: AccessTokenCallback): () => void {
        return this._expiringTimer.addHandler(cb);
    }
    /**
     * Remove callback: Raised prior to the access token expiring.
     */
    public removeAccessTokenExpiring(cb: AccessTokenCallback): void {
        this._expiringTimer.removeHandler(cb);
    }

    /**
     * Add callback: Raised after the access token has expired.
     */
    public addAccessTokenExpired(cb: AccessTokenCallback): () => void {
        return this._expiredTimer.addHandler(cb);
    }
    /**
     * Remove callback: Raised after the access token has expired.
     */
    public removeAccessTokenExpired(cb: AccessTokenCallback): void {
        this._expiredTimer.removeHandler(cb);
    }
}
