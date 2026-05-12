import { Task, WorkerStatus } from '../models/Worker';

function updateTaskStatus(
  queue: Task[],
  index: number,
  status: WorkerStatus,
  statusMessage?: string,
): Task[] {
  if (statusMessage === undefined) {
    return queue.map((task, i) => (i === index ? { ...task, status } : task));
  } else {
    return queue.map((task, i) => (i === index ? { ...task, status, statusMessage } : task));
  }
}

export { updateTaskStatus };
