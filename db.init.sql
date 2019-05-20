CREATE TABLE `isin` (
 `isin` varchar(20) NOT NULL,
 `name` varchar(50) NOT NULL,
 `currency` varchar(3) NOT NULL,
 `updated_ts` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
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
 `ts` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
 `price` decimal(10,2) NOT NULL,
 PRIMARY KEY (`isin`,`ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;