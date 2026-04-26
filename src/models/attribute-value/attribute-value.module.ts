import { Module } from "@nestjs/common";
import { AttributeValueService } from "./attribute-value.service";
import { AttributeValueController } from "./attribute-value.controller";

@Module({
    controllers: [AttributeValueController],
    providers: [AttributeValueService],
    exports: [AttributeValueService]
})
export class AttributeValueModule {}
