import { Module } from "@nestjs/common";
import { ViewService } from "./view.service";
import { ViewController } from "./view.controller";

@Module({
    controllers: [ViewController],
    providers: [ViewService],
    exports: [ViewService]
})
export class ViewModule {}
