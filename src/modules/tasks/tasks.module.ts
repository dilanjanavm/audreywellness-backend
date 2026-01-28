import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskPhaseEntity } from './entities/task-phase.entity';
import { TaskEntity } from './entities/task.entity';
import { TaskCommentEntity } from './entities/task-comment.entity';
import { TaskMovementHistoryEntity } from './entities/task-movement-history.entity';
import { TaskRecipeExecutionEntity } from './entities/task-recipe-execution.entity';
import { TaskRecipeStepExecutionEntity } from './entities/task-recipe-step-execution.entity';
<<<<<<< HEAD
=======
import { TaskRecipePreparationQuestionStatusEntity } from './entities/task-recipe-preparation-question-status.entity';
>>>>>>> origin/new-dev
import { TaskTemplateEntity } from './entities/task-template.entity';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { RecipeExecutionService } from './recipe-execution.service';
import { RecipeExecutionController } from './recipe-execution.controller';
import { TaskTemplateController } from './task-template.controller';
import { TaskTemplateService } from './task-template.service';
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
<<<<<<< HEAD
=======
      TaskRecipePreparationQuestionStatusEntity,
>>>>>>> origin/new-dev
      TaskTemplateEntity,
      User,
      CostingEntity,
    ]),
    CostingModule, // Import to access CostingService
    RecipesModule, // Import to access RecipesService
  ],
  controllers: [TasksController, RecipeExecutionController, TaskTemplateController],
  providers: [TasksService, RecipeExecutionService, TaskTemplateService],
  exports: [TasksService, RecipeExecutionService, TaskTemplateService],
})
export class TasksModule {}
