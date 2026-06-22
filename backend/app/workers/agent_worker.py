"""
🤖 Agent Worker
Background worker for executing AI agent tasks
"""
import asyncio
import json
import redis.asyncio as redis
from datetime import datetime
import os


class AgentWorker:
    """Worker that processes agent tasks from Redis queue."""

    def __init__(self):
        self.redis = redis.from_url(
            os.getenv("REDIS_URL", "redis://localhost:6379"),
            decode_responses=True
        )
        self.running = False
        self.concurrency = int(os.getenv("WORKER_CONCURRENCY", "4"))

    async def start(self):
        """Start the worker."""
        self.running = True
        print(f"Agent Worker started with concurrency={self.concurrency}")

        # Create worker pool
        tasks = [self._worker_loop(i) for i in range(self.concurrency)]
        await asyncio.gather(*tasks)

    async def _worker_loop(self, worker_id: int):
        """Main worker loop."""
        while self.running:
            try:
                # Blocking pop from queue
                result = await self.redis.blpop("agent:tasks", timeout=5)

                if result:
                    _, task_json = result
                    task = json.loads(task_json)
                    await self._process_task(task, worker_id)

            except Exception as e:
                print(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(1)

    async def _process_task(self, task: dict, worker_id: int):
        """Process a single agent task."""
        task_id = task["id"]
        agent_id = task["agent_id"]
        task_type = task["type"]

        print(f"[{worker_id}] Processing task {task_id} for agent {agent_id}")

        # Update status
        await self.redis.hset(f"agent:{agent_id}:status", mapping={
            "status": "running",
            "task_id": task_id,
            "started_at": datetime.utcnow().isoformat()
        })

        try:
            # Execute based on task type
            if task_type == "code_generation":
                result = await self._generate_code(task)
            elif task_type == "deployment":
                result = await self._deploy(task)
            elif task_type == "analysis":
                result = await self._analyze(task)
            else:
                result = {"status": "completed", "output": "Task executed"}

            # Store result
            await self.redis.hset(f"task:{task_id}:result", mapping={
                "status": "success",
                "result": json.dumps(result),
                "completed_at": datetime.utcnow().isoformat()
            })

        except Exception as e:
            await self.redis.hset(f"task:{task_id}:result", mapping={
                "status": "error",
                "error": str(e),
                "completed_at": datetime.utcnow().isoformat()
            })

        finally:
            # Update agent status
            await self.redis.hset(f"agent:{agent_id}:status", mapping={
                "status": "idle",
                "last_task": task_id,
                "completed_at": datetime.utcnow().isoformat()
            })

    async def _generate_code(self, task: dict) -> dict:
        """Generate code for a task."""
        await asyncio.sleep(2)  # Simulate work
        return {
            "files_generated": 5,
            "framework": task.get("framework", "react"),
            "lines_of_code": 250
        }

    async def _deploy(self, task: dict) -> dict:
        """Deploy a project."""
        await asyncio.sleep(5)  # Simulate deployment
        return {
            "deployment_id": task["deployment_id"],
            "url": f"https://{task['project_id']}.yasmin.app",
            "status": "success"
        }

    async def _analyze(self, task: dict) -> dict:
        """Analyze code or data."""
        await asyncio.sleep(3)
        return {
            "issues_found": 0,
            "suggestions": ["Optimize imports", "Add error handling"],
            "score": 95
        }

    async def stop(self):
        """Stop the worker."""
        self.running = False
        print("Agent Worker stopped")


async def main():
    worker = AgentWorker()
    try:
        await worker.start()
    except KeyboardInterrupt:
        await worker.stop()


if __name__ == "__main__":
    asyncio.run(main())
