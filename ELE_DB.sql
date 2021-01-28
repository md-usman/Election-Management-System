-- MySQL dump 10.13  Distrib 8.0.22, for Linux (x86_64)
--
-- Host: localhost    Database: ELE_DB
-- ------------------------------------------------------
-- Server version	8.0.22

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ADD_USER`
--

DROP TABLE IF EXISTS `ADD_USER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ADD_USER` (
  `m_id` int NOT NULL,
  `voter_id` int NOT NULL,
  PRIMARY KEY (`m_id`,`voter_id`),
  KEY `fusrv` (`voter_id`),
  CONSTRAINT `fusrm` FOREIGN KEY (`m_id`) REFERENCES `MODERATOR` (`m_id`) ON DELETE CASCADE,
  CONSTRAINT `fusrv` FOREIGN KEY (`voter_id`) REFERENCES `VOTER` (`voter_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ADD_USER`
--

LOCK TABLES `ADD_USER` WRITE;
/*!40000 ALTER TABLE `ADD_USER` DISABLE KEYS */;
/*!40000 ALTER TABLE `ADD_USER` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ADMIN`
--

DROP TABLE IF EXISTS `ADMIN`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ADMIN` (
  `admin_id` varchar(20) NOT NULL,
  `password` varchar(20) DEFAULT NULL,
  `election_status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ADMIN`
--

LOCK TABLES `ADMIN` WRITE;
/*!40000 ALTER TABLE `ADMIN` DISABLE KEYS */;
INSERT INTO `ADMIN` VALUES ('admin','admin','active');
/*!40000 ALTER TABLE `ADMIN` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MODERATOR`
--

DROP TABLE IF EXISTS `MODERATOR`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MODERATOR` (
  `m_id` int NOT NULL,
  `password` varchar(100) DEFAULT NULL,
  `voter_id` int DEFAULT NULL,
  PRIMARY KEY (`m_id`),
  KEY `fvotM` (`voter_id`),
  CONSTRAINT `fvotM` FOREIGN KEY (`voter_id`) REFERENCES `VOTER` (`voter_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MODERATOR`
--

LOCK TABLES `MODERATOR` WRITE;
/*!40000 ALTER TABLE `MODERATOR` DISABLE KEYS */;
/*!40000 ALTER TABLE `MODERATOR` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PARTY`
--

DROP TABLE IF EXISTS `PARTY`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PARTY` (
  `p_id` int NOT NULL,
  `pname` varchar(30) DEFAULT NULL,
  `leader` int DEFAULT NULL,
  `ward_id` int DEFAULT NULL,
  `logo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`p_id`),
  KEY `fward` (`ward_id`),
  KEY `fvoter` (`leader`),
  CONSTRAINT `fvoter` FOREIGN KEY (`leader`) REFERENCES `VOTER` (`voter_id`) ON DELETE CASCADE,
  CONSTRAINT `fward` FOREIGN KEY (`ward_id`) REFERENCES `WARD` (`ward_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PARTY`
--

LOCK TABLES `PARTY` WRITE;
/*!40000 ALTER TABLE `PARTY` DISABLE KEYS */;
/*!40000 ALTER TABLE `PARTY` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `VOTER`
--

DROP TABLE IF EXISTS `VOTER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `VOTER` (
  `voter_id` int NOT NULL,
  `fname` varchar(30) DEFAULT NULL,
  `lname` varchar(30) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `gender` varchar(6) DEFAULT NULL,
  `age` int DEFAULT NULL,
  `address` varchar(50) DEFAULT NULL,
  `ward_id` int DEFAULT NULL,
  `phone` double DEFAULT NULL,
  `image` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`voter_id`),
  KEY `ward_idf` (`ward_id`),
  CONSTRAINT `ward_idf` FOREIGN KEY (`ward_id`) REFERENCES `WARD` (`ward_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VOTER`
--

LOCK TABLES `VOTER` WRITE;
/*!40000 ALTER TABLE `VOTER` DISABLE KEYS */;
/*!40000 ALTER TABLE `VOTER` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `VOTES`
--

DROP TABLE IF EXISTS `VOTES`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `VOTES` (
  `p_id` int NOT NULL,
  `voter_id` int NOT NULL,
  PRIMARY KEY (`p_id`,`voter_id`),
  KEY `fvotv` (`voter_id`),
  CONSTRAINT `fvotp` FOREIGN KEY (`p_id`) REFERENCES `PARTY` (`p_id`) ON DELETE CASCADE,
  CONSTRAINT `fvotv` FOREIGN KEY (`voter_id`) REFERENCES `VOTER` (`voter_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VOTES`
--

LOCK TABLES `VOTES` WRITE;
/*!40000 ALTER TABLE `VOTES` DISABLE KEYS */;
/*!40000 ALTER TABLE `VOTES` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8 */ ;
/*!50003 SET character_set_results = utf8 */ ;
/*!50003 SET collation_connection  = utf8_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `VOTE_LOG_TRIGGER` AFTER INSERT ON `VOTES` FOR EACH ROW begin 
insert into VOTE_LOG
( voter_id, party_id, voted_date)  
values 
(NEW.voter_id, NEW.p_id, SYSDATE()); 
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `VOTE_LOG`
--

DROP TABLE IF EXISTS `VOTE_LOG`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `VOTE_LOG` (
  `voter_id` int DEFAULT NULL,
  `party_id` int DEFAULT NULL,
  `voted_date` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VOTE_LOG`
--

LOCK TABLES `VOTE_LOG` WRITE;
/*!40000 ALTER TABLE `VOTE_LOG` DISABLE KEYS */;
/*!40000 ALTER TABLE `VOTE_LOG` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WARD`
--

DROP TABLE IF EXISTS `WARD`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WARD` (
  `ward_id` int NOT NULL,
  `ward_name` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`ward_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WARD`
--

LOCK TABLES `WARD` WRITE;
/*!40000 ALTER TABLE `WARD` DISABLE KEYS */;
/*!40000 ALTER TABLE `WARD` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-01-28 21:08:59
