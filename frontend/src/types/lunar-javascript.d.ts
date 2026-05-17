declare module 'lunar-javascript' {
  export const Solar: {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): {
      getLunar(): {
        getEightChar(): {
          getYear(): string;
          getMonth(): string;
          getDay(): string;
          getTime(): string;
          getDayXunKong(): string;
        };
        getPrevQi(): {
          getName(): string;
          getSolar(): {
            toYmdHms(): string;
          };
        };
      };
    };
  };
}
