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

const BASE_URL = "https://www.law.go.kr/DRF";
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
    
    // URL을 직접 구성
    const url = `${BASE_URL}/lawService.do?OC=${encodeURIComponent(API_KEY)}&target=law&type=XML&ID=${encodeURIComponent(id)}`;
    console.log("Requesting URL:", url);

    const response = await axios.get(url, {
      responseType: "text",
      transformResponse: [(data) => data],
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.law.go.kr/',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });

    if (isErrorPage(response.data)) {
      console.log("Error page detected in response");
      console.log("Response data:", response.data.substring(0, 500));
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
      console.error("API Response Status:", error.response.status);
      console.error("API Response Headers:", error.response.headers);
      console.error("API Response Data:", error.response.data);
    }
    res.status(500).json({
      error: error.message,
      details: error.response?.data || "API 호출 중 오류가 발생했습니다.",
    });
  }
});

// 법령 검색
app.get("/api/law-search", async (req, res) => {
  try {
    console.log("Searching laws with query:", req.query.query);
    const { query } = req.query;
    
    // URL을 직접 구성
    const url = `${BASE_URL}/lawSearch.do?OC=${encodeURIComponent(API_KEY)}&target=law&type=XML&query=${encodeURIComponent(query)}&display=100`;
    console.log("Requesting URL:", url);

    const response = await axios.get(url, {
      responseType: "text",
      transformResponse: [(data) => data],
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.law.go.kr/',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });

    if (isErrorPage(response.data)) {
      console.log("Error page detected in response");
      console.log("Response data:", response.data.substring(0, 500));
      throw new Error("법령정보를 검색할 수 없습니다. API 키를 확인해주세요.");
    }

    console.log("Raw XML response received");
    const jsonData = await parseXML(response.data);
    console.log("XML successfully converted to JSON");
    res.json(jsonData);
  } catch (error) {
    console.error("Error in /api/law-search:", error);
    if (error.response) {
      console.error("API Response Status:", error.response.status);
      console.error("API Response Headers:", error.response.headers);
      console.error("API Response Data:", error.response.data);
    }
    res.status(500).json({
      error: error.message,
      details: error.response?.data || "API 호출 중 오류가 발생했습니다.",
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
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.law.go.kr/',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
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
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.law.go.kr/',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
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
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.law.go.kr/',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
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
      headers: {
        'Accept': 'application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.law.go.kr/',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 10000
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error("Error fetching interpretation:", error);
    res.status(500).json({ error: error.message });
  }
});

// 서버 IP 확인 엔드포인트
app.get("/api/server-ip", async (req, res) => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    console.log('Server IP:', response.data.ip);
    res.json({ serverIP: response.data.ip });
  } catch (error) {
    console.error('Error getting server IP:', error);
    res.status(500).json({ error: 'Failed to get server IP' });
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
