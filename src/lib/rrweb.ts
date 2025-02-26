import { record as rrwebRecord } from "@rrweb/record";
import { getRecordConsolePlugin } from "@rrweb/rrweb-plugin-console-record";

let stopFn: (() => void) | null = null;

export function startRecording(onData: (event: any) => void) {
  if (stopFn) {
    stopFn();
  }

  stopFn = rrwebRecord({
    emit: onData,
    plugins: [
      getRecordConsolePlugin({
        level: ["info", "log", "warn", "error"],
        lengthThreshold: 10000,
      }),
    ],
  });

  return stopFn;
}

export function stopRecording() {
  if (stopFn) {
    stopFn();
    stopFn = null;
  }
}
