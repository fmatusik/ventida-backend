import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserService } from "./user.service";
import { UserMapper } from "./user.mapper";
import { AuthGuard } from "@nestjs/passport";
import { RequiredKeys } from "@prisma/client/runtime/library";
import { ListingService } from "../listing/listing.service";
import { ListingMapper } from "../listing/listing.mapper";
import { ReviewService } from "../review/review.service";
import { ReviewMapper } from "../review/review.mapper";

 

@Controller('user')
export class UserController{

  constructor( private readonly userService: UserService,
    private readonly listingService: ListingService,
    private readonly reviewService: ReviewService
   ) {}

    @Post()
    async create(@Body() body: CreateUserDto) {
        const user = await this.userService.create(body)
        return {
          success: true,
          userId: user.id
        }
    }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getUser(@Req() req: Request) {
    const userEmail = (req as any).user['email'];
    const user = await this.userService.getByEmail(userEmail);
    if(!user) throw new NotFoundException(`This user was not found`);
    return user;
    //return UserMapper.toAccountDetails(user, user.);
  }
  
  @Get('search')
  async search(@Query('q') query: string) {
    const users = await this.userService.search(query);
    return users.map(user => UserMapper.toAccountDetails(user, 0)); // Rating 0 for search results for now
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const res = await this.userService.getByIdForAccountDetails(Number(id));
    if(!res) throw new NotFoundException(`This user was not found`);
    return UserMapper.toAccountDetails(res.user, res.avgRating);
  }

  @Get(':id/listings')
  async getUserListingsById(@Param('id') id: number) {
    const res = await this.listingService.getByUserId(id);
    if(!res) throw new NotFoundException(`This user has no listings or does not exist`);
    return res.map(listing => ListingMapper.toShortListingSummary(listing));
  }

  
  @Get(':id/reviews')
  async getUserRewievsById(@Param('id') id: number) {
    const res = await this.reviewService.getByUserId(id);
    if(!res) throw new NotFoundException(`This user has no listings or does not exist`);
    return res.map(review => ReviewMapper.toGetReview(review));
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.userService.update(Number(id), body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id/password')
  async updatePassword(@Param('id') id: string, @Body() body: any) {
    return await this.userService.updatePassword(Number(id), body.oldPassword, body.newPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.userService.delete(Number(id));
  }
}