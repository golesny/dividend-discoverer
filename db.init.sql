CREATE TABLE `isin` (
 `isin` varchar(20) NOT NULL,
 `name` varchar(50) NOT NULL,
 `currency` varchar(3) NOT NULL
 PRIMARY KEY (`isin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `dividend` (
 `isin` varchar(20) NOT NULL,
 `date` date NOT NULL,
 `price` decimal(10,2) NOT NULL,
 PRIMARY KEY (`isin`,`date`)
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
 `div_5_avg` decimal(10,2),
 `div_10_avg` decimal(10,2),
 `div_15_avg` decimal(10,2),
 `div_pessimistic` decimal(10,2),
 PRIMARY KEY (`isin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;