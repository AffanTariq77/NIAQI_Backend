import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { StudentProfileService } from "./student-profile.service";
import {
  CreateStudentProfileDto,
  UpdateStudentProfileDto,
} from "./dto/student-profile.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("student-profile")
@UseGuards(JwtAuthGuard)
export class StudentProfileController {
  constructor(private studentProfileService: StudentProfileService) {}

  @Get()
  async getStudentProfile(@Request() req) {
    return this.studentProfileService.getStudentProfile(req.user.userId);
  }

  @Post()
  async createStudentProfile(
    @Request() req,
    @Body() createStudentProfileDto: CreateStudentProfileDto
  ) {
    return this.studentProfileService.createStudentProfile(
      req.user.userId,
      createStudentProfileDto
    );
  }

  @Patch()
  async updateStudentProfile(
    @Request() req,
    @Body() updateStudentProfileDto: UpdateStudentProfileDto
  ) {
    return this.studentProfileService.updateStudentProfile(
      req.user.userId,
      updateStudentProfileDto
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStudentProfile(@Request() req) {
    await this.studentProfileService.deleteStudentProfile(req.user.userId);
  }
}
