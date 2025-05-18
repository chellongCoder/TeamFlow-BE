import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private _client: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (!this.configService.supabaseUrl || !this.configService.supabaseKey) {
      throw new Error('Supabase URL or key is not set');
    }
    this._client = createClient(
      this.configService.supabaseUrl,
      this.configService.supabaseKey,
    );
  }

  get client(): SupabaseClient {
    return this._client;
  }

  async getUser(token: string) {
    return this._client.auth.getUser(token);
  }

  async signUp(email: string, password: string) {
    return this._client.auth.signUp({
      email,
      password,
    });
  }

  async signIn(email: string, password: string) {
    return this._client.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signOut() {
    return this._client.auth.signOut({
      scope: 'global',
    });
  }
}
