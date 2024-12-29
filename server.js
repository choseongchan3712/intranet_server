const express = require("express");
const cors = require("cors");
const axios = require("axios");
const xml2js = require("xml2js");
require("dotenv").config();

const app = express();

// CORS 설정
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const BASE_URL = "http://www.law.go.kr/DRF";
const API_KEY = process.env.LAW_API_KEY || "choseongchan3712";

// 기본 경로
app.get("/", (req, res) => {
  res.json({ message: "Law API Proxy Server is running" });
});

// 상태 확인
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// XML을 JSON으로 변환하는 함수
const parseXML = async (xml) => {
  try {
    // XML 문자열 정제
    const cleanXML = xml
      .replace(/&/g, "&amp;")
      .replace(/[\x00-\x1F\x7F-\x9F]/g, ""); // 제어 문자 제거

    return new Promise((resolve, reject) => {
      const parser = new xml2js.Parser({
        explicitArray: false,
        explicitRoot: false,
        mergeAttrs: true,
        strict: false,
      });

      parser.parseString(cleanXML, (err, result) => {
        if (err) {
          console.error("XML Parse Error:", err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error("XML Parsing Error:", error);
    throw new Error("XML 파싱 중 오류가 발생했습니다");
  }
};

// API 응답이 에러 페이지인지 확인
const isErrorPage = (data) => {
  return (
    data.includes("error500") ||
    data.includes("페이지 접속에 실패하였습니다") ||
    data.includes("국가법령정보 공동활용")
  );
};

// 법령 상세 정보
app.get("/api/law/:id", async (req, res) => {
  try {
    console.log("Fetching law data for ID:", req.params.id);
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/lawService.do`, {
      params: {
        OC: API_KEY,
        target: "law",
        type: "XML",
        ID: id,
      },
      responseType: "text",
      transformResponse: [(data) => data],
    });

    if (isErrorPage(response.data)) {
      throw new Error("법령정보를 가져올 수 없습니다. API 키를 확인해주세요.");
    }

    console.log("Raw XML response received");
    console.log("Response data:", response.data.substring(0, 200) + "..."); // 처음 200자만 로깅
    const jsonData = await parseXML(response.data);
    console.log("XML successfully converted to JSON");
    res.json(jsonData);
  } catch (error) {
    console.error("Error in /api/law/:id:", error);
    if (error.response) {
      console.error("API Response Error:", error.response.data);
    }
    res.status(500).json({
      error: error.message,
      details: error.response?.data || "No additional details",
    });
  }
});

// 법령 검색
app.get("/api/law-search", async (req, res) => {
  try {
    console.log("Searching laws with query:", req.query.query);
    const { query } = req.query;
    const response = await axios.get(`${BASE_URL}/lawSearch.do`, {
      params: {
        OC: API_KEY,
        target: "law",
        type: "XML",
        query,
        display: "100",
      },
      responseType: "text",
      transformResponse: [(data) => data],
    });

    if (isErrorPage(response.data)) {
      throw new Error("법령정보를 검색할 수 없습니다. API 키를 확인해주세요.");
    }

    console.log("Raw XML response received");
    const jsonData = await parseXML(response.data);
    console.log("XML successfully converted to JSON");
    res.json(jsonData);
  } catch (error) {
    console.error("Error in /api/law-search:", error);
    if (error.response) {
      console.error("API Response Error:", error.response.data);
    }
    res.status(500).json({
      error: error.message,
      details: error.response?.data || "No additional details",
    });
  }
});

// 판례 검색
app.get("/api/precedent-search", async (req, res) => {
  try {
    const { query, page } = req.query;
    const response = await axios.get(`${BASE_URL}/lawSearch.do`, {
      params: {
        OC: API_KEY,
        target: "prec",
        type: "XML",
        query,
        page,
        org: "400201",
        display: "100",
      },
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error("Error searching precedent:", error);
    res.status(500).json({ error: error.message });
  }
});

// 판례 상세 정보
app.get("/api/precedent/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/lawService.do`, {
      params: {
        OC: API_KEY,
        target: "prec",
        type: "XML",
        ID: id,
      },
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error("Error fetching precedent:", error);
    res.status(500).json({ error: error.message });
  }
});

// 법령해석례 검색
app.get("/api/interpretation-search", async (req, res) => {
  try {
    const { query, page } = req.query;
    const response = await axios.get(`${BASE_URL}/lawSearch.do`, {
      params: {
        OC: API_KEY,
        target: "expc",
        type: "XML",
        query,
        page,
        display: "100",
      },
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error("Error searching interpretation:", error);
    res.status(500).json({ error: error.message });
  }
});

// 법령해석례 상세 정보
app.get("/api/interpretation/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/lawService.do`, {
      params: {
        OC: API_KEY,
        target: "expc",
        type: "XML",
        ID: id,
      },
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error("Error fetching interpretation:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({
    error: err.message,
    details: err.response?.data || "No additional details",
  });
});

// 서버 시작
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Proxy server is running on port ${PORT}`);
});

// 정상적인 종료 처리
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
