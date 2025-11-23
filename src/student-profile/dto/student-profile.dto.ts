import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsInt,
  IsDateString,
} from "class-validator";

export class CreateStudentProfileDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsOptional()
  @IsInt()
  graduationYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;
}

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsString()
  fieldOfStudy?: string;

  @IsOptional()
  @IsInt()
  graduationYear?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;
}

export class StudentProfileResponseDto {
  id: string;
  userId: string;
  phoneNumber: string | null;
  dateOfBirth: Date | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  bio: string | null;
  profileImage: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
  graduationYear: number | null;
  interests: string[];
  notifications: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.userId = data.userId;
    this.phoneNumber = data.phoneNumber;
    this.dateOfBirth = data.dateOfBirth;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
    this.country = data.country;
    this.postalCode = data.postalCode;
    this.bio = data.bio;
    this.profileImage = data.profileImage;
    this.institution = data.institution;
    this.fieldOfStudy = data.fieldOfStudy;
    this.graduationYear = data.graduationYear;
    this.interests = data.interests || [];
    this.notifications = data.notifications;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
