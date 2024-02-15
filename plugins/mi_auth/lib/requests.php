<?php
namespace Mi\MiAuth;
use GuzzleHttp\Client;
use GuzzleHttp\MessageFormatter;
use GuzzleHttp\Exception\RequestException;

class requests{
  private $client = null;
  private $options = null;
  private $config = null;

  public function __construct(array $config = []){
    $config["requests"]["base_uri"] = $config["api_uri"];
    $this->client = new Client($config["requests"]);
    $this->config = $config;
  }

  public function authUser($id, $mdp): array{
    $response = $this->client->post($this->config['auth_user_endpoint'], [
      'headers' => [
        'Authorization' => 'Basic ' . base64_encode($id . ':' . $mdp),
        'Accept' => 'application/json',
      ],
    ]);
    $code = $response->getStatusCode();
    if($code === 200)
      return \GuzzleHttp\json_decode($response->getBody(), true);
    return [];
  }

  public function auth(): array{
    $response = $this->client->post($this->config['auth_endpoint'], [
      'headers' => [
        'Authorization' => 'Basic ' . base64_encode($this->config['client_id'] . ':' . $this->config['client_secret']),
        'Accept' => 'application/json',
      ],
    ]);
    $code = $response->getStatusCode();
    if($code === 200)
      return \GuzzleHttp\json_decode($response->getBody(), true);
    return [];
  }

  public function portailToken(string $portail_token, string $auth_token): array{
    $response = $this->client->post($this->config['portail_endpoint'], [
      'headers' => [
        'Authorization' => 'Bearer ' . $auth_token,
        'Accept' => 'application/json',
      ],
      'form_params' => [
          'portail_token' => $portail_token,
      ],
    ]);
    $code = $response->getStatusCode();
    if($code === 200)
      return \GuzzleHttp\json_decode($response->getBody(), true);
    return [];
  }

  public function userInfo(string $user_token): array{
    $response = $this->client->get($this->config['userinfo_endpoint'], [
      'headers' => [
        'Authorization' => 'Bearer ' . $user_token,
        'Accept' => 'application/json',
      ],
    ]);
    $code = $response->getStatusCode();
    if($code === 200)
      return \GuzzleHttp\json_decode($response->getBody(), true);
    return [];
  }
}
