import { Controller, Get, Query, Param } from "@nestjs/common";
import { KajabiService } from "./kajabi.service";

@Controller("kajabi")
export class KajabiController {
  constructor(private readonly kajabiService: KajabiService) {}

  @Get("products")
  async getProducts(): Promise<any[]> {
    return this.kajabiService.getProducts();
  }

  @Get("customers")
  async getCustomers(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('search') search?: string,
  ): Promise<any[]> {
    const pageNumber = page ? Number(page) : 1;
    const pageSize = size ? Number(size) : 50;
    return this.kajabiService.getCustomers(pageSize, pageNumber, search);
  }

  @Get('customers/:id')
  async getCustomerById(@Param('id') id: string): Promise<any> {
    return this.kajabiService.getCustomerById(id);
  }
}
