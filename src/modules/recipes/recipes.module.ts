// src/modules/recipes/recipes.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { Recipe } from './entities/recipe.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { ItemEntity } from '../item/entities/item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recipe, RecipeStep, RecipeIngredient, ItemEntity]),
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}

