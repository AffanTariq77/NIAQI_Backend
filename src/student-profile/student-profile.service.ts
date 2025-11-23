import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateStudentProfileDto,
  UpdateStudentProfileDto,
  StudentProfileResponseDto,
} from "./dto/student-profile.dto";

@Injectable()
export class StudentProfileService {
  constructor(private prisma: PrismaService) {}

  async getStudentProfile(userId: string): Promise<StudentProfileResponseDto> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    return new StudentProfileResponseDto(profile);
  }

  async createStudentProfile(
    userId: string,
    createStudentProfileDto: CreateStudentProfileDto
  ): Promise<StudentProfileResponseDto> {
    // Check if profile already exists
    const existingProfile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new Error("Student profile already exists");
    }

    const profile = await this.prisma.studentProfile.create({
      data: {
        userId,
        ...createStudentProfileDto,
        dateOfBirth: createStudentProfileDto.dateOfBirth
          ? new Date(createStudentProfileDto.dateOfBirth)
          : null,
      },
    });

    return new StudentProfileResponseDto(profile);
  }

  async updateStudentProfile(
    userId: string,
    updateStudentProfileDto: UpdateStudentProfileDto
  ): Promise<StudentProfileResponseDto> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    const updateData: any = { ...updateStudentProfileDto };
    if (updateStudentProfileDto.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateStudentProfileDto.dateOfBirth);
    }

    const updatedProfile = await this.prisma.studentProfile.update({
      where: { userId },
      data: updateData,
    });

    return new StudentProfileResponseDto(updatedProfile);
  }

  async deleteStudentProfile(userId: string): Promise<void> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException("Student profile not found");
    }

    await this.prisma.studentProfile.delete({
      where: { userId },
    });
  }
}
