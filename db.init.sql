CREATE TABLE `isin` (
 `isin` varchar(20) NOT NULL,
 `name` varchar(50) NOT NULL,
 `currency` varchar(3) NOT NULL,
 `sector` varchar(50),
 PRIMARY KEY (`isin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `dividend` (
 `isin` varchar(20) NOT NULL,
 `date` date NOT NULL,
 `price` decimal(10,6) NOT NULL,
 `estimated` tinyint(1) NOT NULL,
 PRIMARY KEY (`isin`,`date`,`estimated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `price` (
 `isin` varchar(20) NOT NULL,
 `date` date NOT NULL,
 `price` decimal(10,2) NOT NULL,
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