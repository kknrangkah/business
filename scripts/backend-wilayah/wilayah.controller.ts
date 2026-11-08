import { Controller, Get, Query } from '@nestjs/common';
import { WilayahService } from './wilayah.service';

@Controller('v1/wilayah')
export class WilayahController {
  constructor(private readonly wilayahService: WilayahService) {}

  /**
   * GET /v1/wilayah/provinsi
   * Query: search, page, limit
   */
  @Get('provinsi')
  async getProvinsi(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 38,
  ) {
    return this.wilayahService.getProvinsi(search, Number(page), Number(limit));
  }

  /**
   * GET /v1/wilayah/kabupaten-kota
   * Query: search, kode_provinsi, tipe, page, limit
   */
  @Get('kabupaten-kota')
  async getKabupatenKota(
    @Query('search') search?: string,
    @Query('kode_provinsi') kodeProvinsi?: string,
    @Query('tipe') tipe?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.wilayahService.getKabupatenKota(
      search,
      kodeProvinsi,
      tipe,
      Number(page),
      Number(limit),
    );
  }

  /**
   * GET /v1/wilayah/kecamatan
   * Query: search, kode_kabupaten_kota, page, limit
   */
  @Get('kecamatan')
  async getKecamatan(
    @Query('search') search?: string,
    @Query('kode_kabupaten_kota') kodeKabupaten?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.wilayahService.getKecamatan(
      search,
      kodeKabupaten,
      Number(page),
      Number(limit),
    );
  }

  /**
   * GET /v1/wilayah/kelurahan
   * Query: search, kode_kecamatan, tipe, page, limit
   */
  @Get('kelurahan')
  async getKelurahan(
    @Query('search') search?: string,
    @Query('kode_kecamatan') kodeKecamatan?: string,
    @Query('tipe') tipe?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 25,
  ) {
    return this.wilayahService.getKelurahan(
      search,
      kodeKecamatan,
      tipe,
      Number(page),
      Number(limit),
    );
  }
}
