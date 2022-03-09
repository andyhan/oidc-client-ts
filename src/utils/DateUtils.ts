/**
 * @internal
 */
export class DateUtils {
    public static getEpochTime(): number {
        return Math.floor(Date.now() / 1000);
    }
}
