const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const BASE_URL = 'http://www.law.go.kr/DRF';
const API_KEY = process.env.LAW_API_KEY || 'choseongchan3712';

// 법령 상세 정보
app.get('/api/law/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/lawService.do`, {
      params: {
        OC: API_KEY,
        target: 'law',
        type: 'JSON',
        ID: id
      }
    });
    res.json(response.data);
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
        type: 'JSON',
        query,
        display: '100'
      }
    });
    res.json(response.data);
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
        type: 'JSON',
        query,
        page,
        org: '400201',
        display: '100'
      }
    });
    res.json(response.data);
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
        type: 'JSON',
        ID: id
      }
    });
    res.json(response.data);
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
        type: 'JSON',
        query,
        page,
        display: '100'
      }
    });
    res.json(response.data);
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
        type: 'JSON',
        ID: id
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching interpretation:', error);
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
