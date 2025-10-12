import { Test, TestingModule } from '@nestjs/testing';
import { ItemManagementService } from './item-management.service';

describe('ItemManagementService', () => {
  let service: ItemManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItemManagementService],
    }).compile();

    service = module.get<ItemManagementService>(ItemManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
