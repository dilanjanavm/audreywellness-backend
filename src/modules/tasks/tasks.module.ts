import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskPhaseEntity } from './entities/task-phase.entity';
import { TaskEntity } from './entities/task.entity';
import { TaskCommentEntity } from './entities/task-comment.entity';
import { TaskMovementHistoryEntity } from './entities/task-movement-history.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { User } from '../users/user.entity';
import { CostingEntity } from '../costing/entities/costing.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskPhaseEntity,
      TaskEntity,
      TaskCommentEntity,
      TaskMovementHistoryEntity,
      User,
      CostingEntity,
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
