<?php

namespace App\Console\Commands;

use App\Services\PayPalService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestPayPalConnection extends Command
{
    protected $signature = 'paypal:test';
    protected $description = 'Test PayPal API connection and credentials';

    public function handle()
    {
        $this->info('Testing PayPal API connection...');
        
        $clientId = config('services.paypal.client_id');
        $clientSecret = config('services.paypal.client_secret');
        $mode = config('services.paypal.mode', 'sandbox');
        
        if (!$clientId || !$clientSecret) {
            $this->error('PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env file.');
            return 1;
        }
        
        $this->info("Mode: {$mode}");
        $this->info("Client ID: " . substr($clientId, 0, 10) . "...");
        
        $baseUrl = $mode === 'live' 
            ? 'https://api.paypal.com' 
            : 'https://api.sandbox.paypal.com';
            
        try {
            $this->info('Attempting to get access token...');
            
            $response = Http::withBasicAuth($clientId, $clientSecret)
                ->asForm()
                ->post("{$baseUrl}/v1/oauth2/token", [
                    'grant_type' => 'client_credentials'
                ]);

            if ($response->successful()) {
                $this->info('✅ PayPal API connection successful!');
                $this->info('Access token obtained successfully.');
                
                $tokenData = $response->json();
                $this->info("Token type: {$tokenData['token_type']}");
                $this->info("Expires in: {$tokenData['expires_in']} seconds");
                
                return 0;
            } else {
                $this->error('❌ PayPal API connection failed!');
                $this->error("Status: {$response->status()}");
                $this->error("Response: {$response->body()}");
                
                return 1;
            }
            
        } catch (\Exception $e) {
            $this->error('❌ PayPal API connection failed with exception!');
            $this->error("Error: {$e->getMessage()}");
            
            return 1;
        }
    }
}