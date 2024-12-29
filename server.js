const express = require('express');
const cors = require('cors');
const axios = require('axios');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const BASE_URL = 'http://www.law.go.kr/DRF';
const API_KEY = process.env.LAW_API_KEY || 'choseongchan3712';

// XML을 JSON으로 변환하는 함수
const parseXML = async (xml) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// 법령 상세 정보
app.get('/api/law/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/lawService.do`, {
      params: {
        OC: API_KEY,
        target: 'law',
        type: 'XML',
        ID: id
      }
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error('Error fetching law data:', error);
    res.status(500).send(error.message);
  }
});

// 법령 검색
app.get('/api/law-search', async (req, res) => {
  try {
    const { query } = req.query;
    const response = await axios.get(`${BASE_URL}/lawSearch.do`, {
      params: {
        OC: API_KEY,
        target: 'law',
        type: 'XML',
        query,
        display: '100'
      }
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error('Error searching law:', error);
    res.status(500).send(error.message);
  }
});

// 판례 검색
app.get('/api/precedent-search', async (req, res) => {
  try {
    const { query, page } = req.query;
    const response = await axios.get(`${BASE_URL}/lawSearch.do`, {
      params: {
        OC: API_KEY,
        target: 'prec',
        type: 'XML',
        query,
        page,
        org: '400201',
        display: '100'
      }
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error('Error searching precedent:', error);
    res.status(500).send(error.message);
  }
});

// 판례 상세 정보
app.get('/api/precedent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/lawService.do`, {
      params: {
        OC: API_KEY,
        target: 'prec',
        type: 'XML',
        ID: id
      }
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error('Error fetching precedent:', error);
    res.status(500).send(error.message);
  }
});

// 법령해석례 검색
app.get('/api/interpretation-search', async (req, res) => {
  try {
    const { query, page } = req.query;
    const response = await axios.get(`${BASE_URL}/lawSearch.do`, {
      params: {
        OC: API_KEY,
        target: 'expc',
        type: 'XML',
        query,
        page,
        display: '100'
      }
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error('Error searching interpretation:', error);
    res.status(500).send(error.message);
  }
});

// 법령해석례 상세 정보
app.get('/api/interpretation/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/lawService.do`, {
      params: {
        OC: API_KEY,
        target: 'expc',
        type: 'XML',
        ID: id
      }
    });
    const jsonData = await parseXML(response.data);
    res.json(jsonData);
  } catch (error) {
    console.error('Error fetching interpretation:', error);
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
