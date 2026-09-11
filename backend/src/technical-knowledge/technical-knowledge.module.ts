import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TechnicalKnowledgeController } from './technical-knowledge.controller';
import { TechnicalKnowledgeService } from './technical-knowledge.service';

@Module({ imports: [AuthModule], controllers: [TechnicalKnowledgeController], providers: [TechnicalKnowledgeService] })
export class TechnicalKnowledgeModule {}
