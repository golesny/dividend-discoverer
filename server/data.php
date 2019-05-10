<?php

header("Content-type: text/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");


 $retVal = array(createStockObj("DE1", "Lbl1"), createStockObj("DE2", "Lbl2"));

 echo json_encode($retVal);

 function createStockObj($isin, $name) {
    return array("isin" => array('isin' => $isin, 'name' => $name, 'currency' => '€'),
      'last10yPercentage' => 5.6,
      'last20yPercentage' => 3.5,
      'divIn30y' => 4000,
      'divCum30y' => 30000 
    );
 }

?>