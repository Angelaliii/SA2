"use client";

import { useEffect, useState } from "react";
import { TextField, MenuItem, Grid, Card, CardContent, Typography, Container } from "@mui/material";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import Navbar from "../../components/Navbar";

export default function ActivityListPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    date: "",
    participants: "",
    type: ""
  });

  useEffect(() => {
    const fetchActivities = async () => {
      const q = query(collection(db, "activities"), orderBy("date", "desc"));
      const snapshot = await getDocs(q);
      const result = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivities(result);
    };
    fetchActivities();
  }, []);

  const filtered = activities.filter(act => {
    const dateMatch = filters.date ? act.date.toDate().toISOString().split("T")[0] === filters.date : true;
    const typeMatch = filters.type ? act.type === filters.type : true;
    const peopleMatch = filters.participants ? act.participants >= Number(filters.participants) : true;
    return dateMatch && typeMatch && peopleMatch;
  });

  return (
    <Container>
      <Navbar />
      <Typography variant="h4" mt={4} mb={2}>活動總覽</Typography>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="活動日期" type="date" InputLabelProps={{ shrink: true }} value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="最低參與人數" type="number" value={filters.participants} onChange={(e) => setFilters({ ...filters, participants: e.target.value })} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="活動性質" select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <MenuItem value="">全部</MenuItem>
            <MenuItem value="迎新">迎新</MenuItem>
            <MenuItem value="講座">講座</MenuItem>
            <MenuItem value="比賽">比賽</MenuItem>
            <MenuItem value="展覽">展覽</MenuItem>
            <MenuItem value="其他">其他</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {filtered.map((act) => (
          <Grid item xs={12} sm={6} md={4} key={act.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{act.name}</Typography>
                <Typography variant="body2">📅 {act.date.toDate().toLocaleDateString()}</Typography>
                <Typography variant="body2">👥 {act.participants} 人</Typography>
                <Typography variant="body2">🔖 {act.type}</Typography>
                <Typography variant="body2" mt={1}>{act.content}</Typography>
                {act.partnerCompany && <Typography variant="caption" display="block">🤝 合作企業：{act.partnerCompany}</Typography>}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
