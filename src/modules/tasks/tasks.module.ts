import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskPhaseEntity } from './entities/task-phase.entity';
import { TaskEntity } from './entities/task.entity';
import { TaskCommentEntity } from './entities/task-comment.entity';
import { TaskMovementHistoryEntity } from './entities/task-movement-history.entity';
import { TaskRecipeExecutionEntity } from './entities/task-recipe-execution.entity';
import { TaskRecipeStepExecutionEntity } from './entities/task-recipe-step-execution.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { RecipeExecutionService } from './recipe-execution.service';
import { RecipeExecutionController } from './recipe-execution.controller';
import { User } from '../users/user.entity';
import { CostingEntity } from '../costing/entities/costing.entity';
import { CostingModule } from '../costing/costing.module';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskPhaseEntity,
      TaskEntity,
      TaskCommentEntity,
      TaskMovementHistoryEntity,
      TaskRecipeExecutionEntity,
      TaskRecipeStepExecutionEntity,
      User,
      CostingEntity,
    ]),
    CostingModule, // Import to access CostingService
    RecipesModule, // Import to access RecipesService
  ],
  controllers: [TasksController, RecipeExecutionController],
  providers: [TasksService, RecipeExecutionService],
  exports: [TasksService, RecipeExecutionService],
})
export class TasksModule {}
