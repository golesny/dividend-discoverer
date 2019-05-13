<?php
error_reporting(E_ALL);
ini_set('display_errors', 'on');
// only for development, TODO remove and find better solution
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');
//
header("Content-type: application/json");

// copied from https://github.com/googleapis/google-api-php-client/blob/master/examples/idtoken.php

include_once __DIR__ . '/google-auth-library-php/vendor/autoload.php';

/*************************************************
 * Ensure you've downloaded your oauth credentials
 ************************************************/
if (!$oauth_credentials = getOAuthCredentialsFile()) {
  echo "{error: 'missingOAuth2CredentialsWarning'}";
  return;
}

/************************************************
 * NOTICE:
 * The redirect URI is to the current page, e.g:
 * http://localhost:8080/idtoken.php
 ************************************************/
$redirect_uri = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['PHP_SELF'];
$client = new Google_Client();
$client->setAuthConfig($oauth_credentials);
$client->setRedirectUri($redirect_uri);
$client->setScopes('email');
/************************************************
 * If we're logging out we just need to clear our
 * local access token in this case
 ************************************************/
if (isset($_REQUEST['logout'])) {
  unset($_SESSION['id_token_token']);
}

/************************************************
 * If we have a code back from the OAuth 2.0 flow,
 * we need to exchange that with the
 * Google_Client::fetchAccessTokenWithAuthCode()
 * function. We store the resultant access token
 * bundle in the session, and redirect to ourself.
 ************************************************/
if (isset($_GET['code'])) {
  $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
  // store in the session also
  $_SESSION['id_token_token'] = $token;
  // redirect back to the example
  header('Location: ' . filter_var($redirect_uri, FILTER_SANITIZE_URL));
  return;
}
/************************************************
  If we have an access token, we can make
  requests, else we generate an authentication URL.
 ************************************************/
if (
  !empty($_SESSION['id_token_token'])
  && isset($_SESSION['id_token_token']['id_token'])
) {
  $client->setAccessToken($_SESSION['id_token_token']);
} else {
  $authUrl = $client->createAuthUrl();
}
/************************************************
  If we're signed in we can go ahead and retrieve
  the ID token, which is part of the bundle of
  data that is exchange in the authenticate step
  - we only need to do a network call if we have
  to retrieve the Google certificate to verify it,
  and that can be cached.
 ************************************************/
if ($client->getAccessToken()) {
  $token_data = $client->verifyIdToken();
}

// end google oauth2

function getOAuthCredentialsFile()
{
  // oauth2 creds
  $oauth_creds = __DIR__ . '/credentials.json';
  if (file_exists($oauth_creds)) {
    return $oauth_creds;
  }
  return false;
}


if (isset($authUrl)) {
  // not connected
  $retVal = array(createStockObj("n/a", "???1"), createStockObj("n/a", "???2"));
} else {
  // connected --> we can proceed
  $retVal = array(createStockObj("DE1", "Lbl1"), createStockObj("DE2", "Lbl2"));
}

 echo json_encode($retVal);

 function createStockObj($isin, $name) {
    return array("isin" => array('isin' => $isin, 'name' => $name, 'currency' => 'â‚¬'),
      'last10yPercentage' => 5.6,
      'last20yPercentage' => 3.5,
      'divIn30y' => 4000,
      'divCum30y' => 30000 
    );
 }

?>