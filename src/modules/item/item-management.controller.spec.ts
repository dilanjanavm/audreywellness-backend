import { Test, TestingModule } from '@nestjs/testing';
import { ItemManagementController } from './item-management.controller';

describe('ItemManagementController', () => {
  let controller: ItemManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemManagementController],
    }).compile();

    controller = module.get<ItemManagementController>(ItemManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
