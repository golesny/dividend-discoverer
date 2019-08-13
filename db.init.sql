CREATE TABLE `isin` (
 `isin` varchar(20) NOT NULL,
 `name` varchar(50) NOT NULL,
 `currency` varchar(3) NOT NULL,
 `sector` varchar(50),
 `symbol` varchar(20) NOT NULL,
 `symbolcurrency` varchar(3),
 PRIMARY KEY (`isin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `dividend` (
 `isin` varchar(20) NOT NULL,
 `date` int(11) NOT NULL,
 `price` decimal(10,6) NOT NULL,
 `estimated` tinyint(1) NOT NULL,
 PRIMARY KEY (`isin`,`date`,`estimated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `price` (
 `isin` varchar(20) NOT NULL,
 `date` date NOT NULL,
 `price` decimal(10,6) NOT NULL,
 PRIMARY KEY (`isin`,`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `report` (
 `isin` varchar(20) NOT NULL,
 `updated_ts` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
 `last10yPercentage` decimal(10,2),
 `last20yPercentage` decimal(10,2),
 `divIn30y` decimal(10,2),
 `divCum30y` decimal(10,2),
 `div_increases` decimal(10,2),
 `div_equal` decimal(10,2),
 `div_decreases` decimal(10,2),
 `div_avg` decimal(10,2),
 `div_4_avg` decimal(10,2),
 `div_8_avg` decimal(10,2),
 `div_12_avg` decimal(10,2),
 `div_16_avg` decimal(10,2),
 `calcbase` float,
 `div_estimated` decimal(10,2),
 PRIMARY KEY (`isin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `portfolio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(40) NOT NULL,
  `isin` varchar(20) NOT NULL,
  `amount` float NOT NULL,
  `date` date NOT NULL,
  `pricetotal` float NOT NULL,
  `type` enum('BUY','SELL','DIV','CASH') NOT NULL,
  `comment` varchar(100) NOT NULL
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `user` (
  `id` varchar(40) NOT NULL,
  `email` varchar(50) NOT NULL,
  `userrights` set('admin','alphavantage','read','write') NOT NULL,
  `targetyear` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

COMMIT;