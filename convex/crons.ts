import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// 매 1분마다 발송대기(pending/processing) 상태에 멈춘 문자를 점검하여 클라우드 자동백업 발송 또는 복구 수행
crons.interval(
  "sweep stuck sms outbox",
  { minutes: 1 },
  internal.sms.sweepStuckOutbox,
  {}
);

export default crons;
