//+------------------------------------------------------------------+
//| ClaudeAI_Trader_Pro_ELITE_Autopilot.mq5                         |
//| EXTREME AI Trading System - AUTOPILOT VERSION                   |
//+------------------------------------------------------------------+
#property copyright "Claude AI Elite Trading System"
#property link      "https://www.anthropic.com"
#property version   "5.00"
#property strict

#include <Trade/Trade.mqh>
#include <Trade/PositionInfo.mqh>
#include <Trade/AccountInfo.mqh>

// Input Parameters (hanya API key dan magic number)
input string ClaudeAPIKey = "";
input int MagicNumber = 999888;
input int FastAnalysisInterval = 60;
input int MinConfidence = 50;
input bool UseLiveAPI = false;

// Global Variables
CTrade trade;
CPositionInfo positionInfo;
CAccountInfo accountInfo;

datetime lastAnalysisTime = 0;
int dailyTradeCount = 0;
datetime lastTradeDate = 0;
string lastSignal = "";
double lastConfidence = 0;
string lastReasoning = "";
int consecutiveAPIErrors = 0;
bool liveAPIMode = true;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=================================================");
   Print("CLAUDE AI PRO ELITE EA v5.0 - AUTOPILOT VERSION");
   Print("=================================================");
   Print("Symbol: ", _Symbol);
   Print("Analysis Interval: ", FastAnalysisInterval, " seconds");
   Print("Min Confidence: ", MinConfidence, "%");
   
   liveAPIMode = UseLiveAPI;
   if(liveAPIMode && (StringLen(ClaudeAPIKey) < 20))
   {
      Print("WARNING: Invalid API Key! Switching to DEMO Mode...");
      liveAPIMode = false;
   }
   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(20);
   trade.SetTypeFilling(ORDER_FILLING_FOK);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("=================================================");
   Print("CLAUDE AI PRO - SESSION SUMMARY");
   Print("=================================================");
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   MqlDateTime currentTime;
   TimeToStruct(TimeCurrent(), currentTime);
   MqlDateTime lastTime;
   TimeToStruct(lastTradeDate, lastTime);
   if(currentTime.day != lastTime.day)
   {
      dailyTradeCount = 0;
      lastTradeDate = TimeCurrent();
      Print("NEW TRADING DAY - Counter Reset!");
   }
   if(TimeCurrent() - lastAnalysisTime < FastAnalysisInterval)
      return;
   lastAnalysisTime = TimeCurrent();
   string marketData = GetAdvancedMarketData();
   string aiDecision = GetClaudeAnalysis(marketData);
   // Parsing instruksi AI (multi-action JSON)
   ParseAndExecuteAIActions(aiDecision);
   // ...existing code for status chart...
   // (Status chart akan diupdate di dalam ParseAndExecuteAIActions)
}
//+------------------------------------------------------------------+
//| Parsing dan eksekusi instruksi AI (open, close, modify)         |
//+------------------------------------------------------------------+
void ParseAndExecuteAIActions(string aiJson)
{
   /*
      Contoh format JSON AI:
      {
        "actions": [
          {"type":"open", "signal":"BUY", "lot":0.1, "sl":800, "tp":2000, "confidence":90, "reasoning":"..."},
          {"type":"close", "ticket":12345},
          {"type":"modify", "ticket":12345, "sl":..., "tp":...}
        ]
      }
   */
   string statusSummary = "";
   datetime analysisTime = TimeCurrent();
   int openCount = 0, closeCount = 0, modifyCount = 0;
   // Cari "actions" array
   int actArr = StringFind(aiJson, "\"actions\"");
   if(actArr < 0) {
      // fallback: tetap parsing single signal lama
      string signal = ""; double confidence = 0; string reasoning = ""; double lot = 0.01; int sl = 0; int tp = 0;
      bool ok = ParseAIDecision(aiJson, signal, confidence, reasoning, lot, sl, tp);
      if(ok && (signal=="BUY"||signal=="SELL")) {
         ExecuteAITrade(signal, confidence, reasoning, lot, sl, tp);
         statusSummary = "✅ EXECUTED: " + signal + " Lot:" + DoubleToString(lot,2) + " SL:" + IntegerToString(sl) + " TP:" + IntegerToString(tp);
      } else {
         statusSummary = "❌ DISKUSI GAGAL - AUTO CLOSE ALL";
         CloseAllPositions();
      }
      ShowStatusOnChart(signal, confidence, reasoning, lot, sl, tp, analysisTime, statusSummary);
      return;
   }
   // Multi-action parsing
   int arrStart = StringFind(aiJson, "[", actArr);
   int arrEnd = StringFind(aiJson, "]", arrStart);
   if(arrStart < 0 || arrEnd < 0) {
      ShowStatusOnChart("ERROR", 0, "Parse AI actions array failed", 0.0, 0, 0, analysisTime, "❌ ERROR: Parse AI actions array");
      return;
   }
   string arrStr = StringSubstr(aiJson, arrStart+1, arrEnd-arrStart-1);
   int pos = 0;
   while(pos < StringLen(arrStr)) {
      // Cari action type
      int tType = StringFind(arrStr, "\"type\":\"", pos);
      if(tType < 0) break;
      int tTypeEnd = StringFind(arrStr, "\"", tType+8);
      string actType = StringSubstr(arrStr, tType+8, tTypeEnd-tType-8);
      // Open
      if(actType=="open") {
         string signal = ""; double lot=0.01; int sl=0; int tp=0; double confidence=0; string reasoning="";
         // signal
         int s = StringFind(arrStr, "\"signal\":\"", tTypeEnd);
         if(s>0) {
            int sEnd = StringFind(arrStr, "\"", s+10);
            signal = StringSubstr(arrStr, s+10, sEnd-s-10);
         }
         // lot
         int l = StringFind(arrStr, "\"lot\":", tTypeEnd);
         if(l>0) {
            string lotStr=""; for(int i=l+6;i<StringLen(arrStr);i++){string ch=StringSubstr(arrStr,i,1);if((ch>="0"&&ch<="9")||ch==".")lotStr+=ch;else if(StringLen(lotStr)>0)break;} if(StringLen(lotStr)>0)lot=StringToDouble(lotStr);}
         // sl
         int slp = StringFind(arrStr, "\"sl\":", tTypeEnd);
         if(slp>0) {string slStr="";for(int i=slp+5;i<StringLen(arrStr);i++){string ch=StringSubstr(arrStr,i,1);if((ch>="0"&&ch<="9"))slStr+=ch;else if(StringLen(slStr)>0)break;}if(StringLen(slStr)>0)sl=StringToInteger(slStr);}
         // tp
         int tpp = StringFind(arrStr, "\"tp\":", tTypeEnd);
         if(tpp>0) {string tpStr="";for(int i=tpp+5;i<StringLen(arrStr);i++){string ch=StringSubstr(arrStr,i,1);if((ch>="0"&&ch<="9"))tpStr+=ch;else if(StringLen(tpStr)>0)break;}if(StringLen(tpStr)>0)tp=StringToInteger(tpStr);}
         // confidence
         int cf = StringFind(arrStr, "\"confidence\":", tTypeEnd);
         if(cf>0) {string cfStr="";for(int i=cf+13;i<StringLen(arrStr);i++){string ch=StringSubstr(arrStr,i,1);if((ch>="0"&&ch<="9")||ch==".")cfStr+=ch;else if(StringLen(cfStr)>0)break;}if(StringLen(cfStr)>0)confidence=StringToDouble(cfStr);}
         // reasoning
         int rs = StringFind(arrStr, "\"reasoning\":\"", tTypeEnd);
         if(rs>0) {int rsEnd=StringFind(arrStr,"\"",rs+13);reasoning=StringSubstr(arrStr,rs+13,rsEnd-rs-13);}
         ExecuteAITrade(signal, confidence, reasoning, lot, sl, tp);
         openCount++;
         pos = tpp>0?tpp+5:tTypeEnd+1;
      }
      // Close
      else if(actType=="close") {
         int tk = StringFind(arrStr, "\"ticket\":", tTypeEnd);
         int ticket=0; if(tk>0){string tkStr="";for(int i=tk+9;i<StringLen(arrStr);i++){string ch=StringSubstr(arrStr,i,1);if((ch>="0"&&ch<="9"))tkStr+=ch;else if(StringLen(tkStr)>0)break;}if(StringLen(tkStr)>0)ticket=StringToInteger(tkStr);}
         ClosePositionByTicket(ticket);
         closeCount++;
         pos = tk>0?tk+9:tTypeEnd+1;
      }
      // Modify
      else if(actType=="modify") {
         int tk = StringFind(arrStr, "\"ticket\":", tTypeEnd);
         int ticket=0; if(tk>0){string tkStr="";for(int i=tk+9;i<StringLen(arrStr);i++){string ch=StringSubstr(arrStr,i,1);if((ch>="0"&&ch<="9"))tkStr+=ch;else if(StringLen(tkStr)>0)break;}if(StringLen(tkStr)>0)ticket=StringToInteger(tkStr);}
         int slp = StringFind(arrStr, "\"sl\":", tTypeEnd);
         int tpp = StringFind(arrStr, "\"tp\":", tTypeEnd);
         double newSL=0,newTP=0;
         if(slp>0){string slStr="";for(int i=slp+5;i<StringLen(arrStr);i++){string ch=StringSubstr(arrStr,i,1);if((ch>="0"&&ch<="9")||ch==".")slStr+=ch;else if(StringLen(slStr)>0)break;}if(StringLen(slStr)>0)newSL=StringToDouble(slStr);}
         if(tpp>0){string tpStr="";for(int i=tpp+5;i<StringLen(arrStr);i++){string ch=StringSubstr(arrStr,i,1);if((ch>="0"&&ch<="9")||ch==".")tpStr+=ch;else if(StringLen(tpStr)>0)break;}if(StringLen(tpStr)>0)newTP=StringToDouble(tpStr);}
         ModifyPositionByTicket(ticket, newSL, newTP);
         modifyCount++;
         pos = tpp>0?tpp+5:tTypeEnd+1;
      }
      else {
         pos = tTypeEnd+1;
      }
   }
   string summary = "OPEN:"+IntegerToString(openCount)+" CLOSE:"+IntegerToString(closeCount)+" MODIFY:"+IntegerToString(modifyCount);
   ShowStatusOnChart("AI", 0, "Multi-action", 0, 0, 0, analysisTime, summary);
}

// Close posisi by ticket
void ClosePositionByTicket(int ticket)
{
   for(int i=0;i<PositionsTotal();i++) {
      if(positionInfo.SelectByIndex(i)) {
         if(positionInfo.Ticket()==ticket) {
            bool closeResult = trade.PositionClose(ticket);
            if(closeResult) {
               Print("[AI CLOSE SUCCESS] Ticket:",ticket);
            } else {
               Print("[AI CLOSE FAILED] Ticket:",ticket," | Error: ", trade.ResultRetcodeDescription());
            }
         }
      }
   }
}

// Modify SL/TP by ticket
void ModifyPositionByTicket(int ticket, double newSL, double newTP)
{
   for(int i=0;i<PositionsTotal();i++) {
      if(positionInfo.SelectByIndex(i)) {
         if(positionInfo.Ticket()==ticket) {
            bool modifyResult = trade.PositionModify(ticket, newSL, newTP);
            if(modifyResult) {
               Print("[AI MODIFY SUCCESS] Ticket:",ticket," SL:",newSL," TP:",newTP);
            } else {
               Print("[AI MODIFY FAILED] Ticket:",ticket," SL:",newSL," TP:",newTP," | Error: ", trade.ResultRetcodeDescription());
            }
         }
      }
   }
}
//+------------------------------------------------------------------+
//| Tampilkan status lengkap di chart (Comment)                     |
//+------------------------------------------------------------------+
void ShowStatusOnChart(string signal, double confidence, string reasoning, double lot, int sl, int tp, datetime analysisTime = 0, string execStatus = "")
{
   double balance = accountInfo.Balance();
   double equity = accountInfo.Equity();
   int openPositions = 0;
   for(int i = 0; i < PositionsTotal(); i++)
   {
      if(positionInfo.SelectByIndex(i))
      {
         if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == MagicNumber)
            openPositions++;
      }
   }
   string status = "\n";
   status += "╔════════════════════════════════════╗\n";
   status += "║  CLAUDE AI ELITE AUTOPILOT v5.0  ║\n";
   status += "╚════════════════════════════════════╝\n\n";
   status += "🟢 SIGNAL      : " + signal + "\n";
   status += "📊 CONFIDENCE  : " + DoubleToString(confidence, 1) + "%\n";
   status += "💡 REASON      : " + reasoning + "\n";
   status += "🔢 LOT         : " + DoubleToString(lot, 2) + "\n";
   status += "🛡️  SL (point)  : " + IntegerToString(sl) + "\n";
   status += "🎯 TP (point)  : " + IntegerToString(tp) + "\n";
   status += "💰 BALANCE     : $" + DoubleToString(balance, 2) + "\n";
   status += "💵 EQUITY      : $" + DoubleToString(equity, 2) + "\n";
   status += "📈 OPEN POS    : " + IntegerToString(openPositions) + "\n";
   status += "📅 TODAY TRADE : " + IntegerToString(dailyTradeCount) + "\n";
   if(analysisTime > 0)
      status += "⏳ ANALYSIS AT : " + TimeToString(analysisTime, TIME_DATE|TIME_SECONDS) + "\n";
   if(execStatus != "")
      status += "🚦 STATUS      : " + execStatus + "\n";
   status += "⏰ LAST UPDATE : " + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\n";
   Comment(status);
}

//+------------------------------------------------------------------+
//| Get Advanced Market Data (termasuk saldo)                       |
//+------------------------------------------------------------------+
string GetAdvancedMarketData()
{
   double close[], high[], low[], open[];
   ArraySetAsSeries(close, true);
   ArraySetAsSeries(high, true);
   ArraySetAsSeries(low, true);
   ArraySetAsSeries(open, true);
   CopyClose(_Symbol, PERIOD_M15, 0, 100, close);
   CopyHigh(_Symbol, PERIOD_M15, 0, 100, high);
   CopyLow(_Symbol, PERIOD_M15, 0, 100, low);
   CopyOpen(_Symbol, PERIOD_M15, 0, 100, open);
   double rsi = CalculateRSI();
   double macd_main = 0, macd_signal = 0;
   CalculateMACD(macd_main, macd_signal);
   double ma20 = CalculateMA(20);
   double ma50 = CalculateMA(50);
   double atr = CalculateATR();
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double spread = (SymbolInfoDouble(_Symbol, SYMBOL_ASK) - bid) * MathPow(10, _Digits);
   double balance = accountInfo.Balance();
   string data = "PRICE: " + DoubleToString(bid, _Digits) + " | SPREAD: " + DoubleToString(spread, 1) + "\n";
   data += "RSI: " + DoubleToString(rsi, 2) + "\n";
   data += "MACD: " + DoubleToString(macd_main, 5) + "/" + DoubleToString(macd_signal, 5) + "\n";
   data += "MA20: " + DoubleToString(ma20, _Digits) + "\n";
   data += "MA50: " + DoubleToString(ma50, _Digits) + "\n";
   data += "ATR: " + DoubleToString(atr, _Digits) + "\n";
   data += "BALANCE: " + DoubleToString(balance, 2) + "\n";

   // Tambahkan status posisi terbuka ke marketData
   data += "POSITIONS:\n";
   for(int i = 0; i < PositionsTotal(); i++) {
      if(positionInfo.SelectByIndex(i)) {
         if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == MagicNumber) {
            data += "- ticket:" + IntegerToString(positionInfo.Ticket()) + ", type:" + IntegerToString(positionInfo.PositionType()) + ", lot:" + DoubleToString(positionInfo.Volume(),2) + ", price:" + DoubleToString(positionInfo.PriceOpen(),_Digits) + ", sl:" + DoubleToString(positionInfo.StopLoss(),_Digits) + ", tp:" + DoubleToString(positionInfo.TakeProfit(),_Digits) + ", profit:" + DoubleToString(positionInfo.Profit(),2) + "\n";
         }
      }
   }
   return data;
}

//+------------------------------------------------------------------+
//| Calculate RSI                                                    |
//+------------------------------------------------------------------+
double CalculateRSI()
{
   double rsi[];
   ArraySetAsSeries(rsi, true);
   int handle = iRSI(_Symbol, PERIOD_M15, 14, PRICE_CLOSE);
   if(handle == INVALID_HANDLE) return 50;
   if(CopyBuffer(handle, 0, 0, 1, rsi) <= 0) return 50;
   IndicatorRelease(handle);
   return rsi[0];
}

//+------------------------------------------------------------------+
//| Calculate MACD                                                   |
//+------------------------------------------------------------------+
void CalculateMACD(double &main, double &signal)
{
   double macd_main[], macd_sig[];
   ArraySetAsSeries(macd_main, true);
   ArraySetAsSeries(macd_sig, true);
   int handle = iMACD(_Symbol, PERIOD_M15, 12, 26, 9, PRICE_CLOSE);
   if(handle == INVALID_HANDLE) { main = 0; signal = 0; return; }
   if(CopyBuffer(handle, 0, 0, 1, macd_main) <= 0) { main = 0; signal = 0; IndicatorRelease(handle); return; }
   if(CopyBuffer(handle, 1, 0, 1, macd_sig) <= 0) { main = 0; signal = 0; IndicatorRelease(handle); return; }
   main = macd_main[0];
   signal = macd_sig[0];
   IndicatorRelease(handle);
}

//+------------------------------------------------------------------+
//| Calculate Moving Average                                         |
//+------------------------------------------------------------------+
double CalculateMA(int period)
{
   double ma[];
   ArraySetAsSeries(ma, true);
   int handle = iMA(_Symbol, PERIOD_M15, period, 0, MODE_SMA, PRICE_CLOSE);
   if(handle == INVALID_HANDLE) return 0;
   if(CopyBuffer(handle, 0, 0, 1, ma) <= 0) { IndicatorRelease(handle); return 0; }
   IndicatorRelease(handle);
   return ma[0];
}

//+------------------------------------------------------------------+
//| Calculate ATR                                                    |
//+------------------------------------------------------------------+
double CalculateATR()
{
   double atr[];
   ArraySetAsSeries(atr, true);
   int handle = iATR(_Symbol, PERIOD_M15, 14);
   if(handle == INVALID_HANDLE) return 0;
   if(CopyBuffer(handle, 0, 0, 1, atr) <= 0) { IndicatorRelease(handle); return 0; }
   IndicatorRelease(handle);
   return atr[0];
}

//+------------------------------------------------------------------+
//| Get Claude Analysis (API/simulasi)                               |
//+------------------------------------------------------------------+
string GetClaudeAnalysis(string marketData)
{
   if(!liveAPIMode)
      return SimulateEliteClaudeResponse(marketData);
   // ...kode WebRequest ke API Claude (disederhanakan)...
   return SimulateEliteClaudeResponse(marketData); // fallback demo
}

//+------------------------------------------------------------------+
//| Elite AI Simulation (JSON: signal, confidence, reasoning, lot, sl, tp)
//+------------------------------------------------------------------+
string SimulateEliteClaudeResponse(string marketData)
{
   string signal = "HOLD";
   double confidence = 50;
   double lot = 0.01;
   int sl = 800;
   int tp = 2500;
   // Simulasi logika sederhana
   if(StringFind(marketData, "RSI: 3") > 0) { signal = "BUY"; confidence = 90; lot = 0.15; sl = 600; tp = 2000; }
   else if(StringFind(marketData, "RSI: 7") > 0) { signal = "SELL"; confidence = 85; lot = 0.12; sl = 700; tp = 1800; }
   string reasoning = "Simulasi AI: Semua parameter trade diatur otomatis.";
   string response = "{";
   response += "\"signal\":\"" + signal + "\",";
   response += "\"confidence\":" + DoubleToString(confidence, 0) + ",";
   response += "\"reasoning\":\"" + reasoning + "\",";
   response += "\"lot\":" + DoubleToString(lot, 2) + ",";
   response += "\"sl\":" + IntegerToString(sl) + ",";
   response += "\"tp\":" + IntegerToString(tp);
   response += "}";
   return response;
}

//+------------------------------------------------------------------+
//| Parse AI Decision (JSON: signal, confidence, reasoning, lot, sl, tp)
//+------------------------------------------------------------------+
bool ParseAIDecision(string decision, string &signal, double &confidence, string &reasoning, double &lot, int &sl, int &tp)
{
   signal = "HOLD";
   confidence = 50;
   reasoning = "Parse error";
   lot = 0.01;
   sl = 800;
   tp = 2500;
   int s = StringFind(decision, "\"signal\":");
   if(s >= 0) {
      int q1 = StringFind(decision, "\"", s+9);
      int q2 = StringFind(decision, "\"", q1+1);
      if(q1 >= 0 && q2 > q1) signal = StringSubstr(decision, q1+1, q2-q1-1);
   }
   int c = StringFind(decision, "\"confidence\":");
   if(c >= 0) {
      int d = StringFind(decision, ":", c);
      string confStr = "";
      for(int i = d+1; i < StringLen(decision); i++) {
         string ch = StringSubstr(decision, i, 1);
         if((ch >= "0" && ch <= "9") || ch == ".") confStr += ch;
         else if(StringLen(confStr) > 0) break;
      }
      if(StringLen(confStr) > 0) confidence = StringToDouble(confStr);
   }
   int r = StringFind(decision, "\"reasoning\":");
   if(r >= 0) {
      int q1 = StringFind(decision, "\"", r+12);
      int q2 = StringFind(decision, "\"", q1+1);
      if(q1 >= 0 && q2 > q1) reasoning = StringSubstr(decision, q1+1, q2-q1-1);
   }
   int l = StringFind(decision, "\"lot\":");
   if(l >= 0) {
      int d = StringFind(decision, ":", l);
      string lotStr = "";
      for(int i = d+1; i < StringLen(decision); i++) {
         string ch = StringSubstr(decision, i, 1);
         if((ch >= "0" && ch <= "9") || ch == ".") lotStr += ch;
         else if(StringLen(lotStr) > 0) break;
      }
      if(StringLen(lotStr) > 0) lot = StringToDouble(lotStr);
   }
   int slp = StringFind(decision, "\"sl\":");
   if(slp >= 0) {
      int d = StringFind(decision, ":", slp);
      string slStr = "";
      for(int i = d+1; i < StringLen(decision); i++) {
         string ch = StringSubstr(decision, i, 1);
         if((ch >= "0" && ch <= "9")) slStr += ch;
         else if(StringLen(slStr) > 0) break;
      }
      if(StringLen(slStr) > 0) sl = StringToInteger(slStr);
   }
   int tpp = StringFind(decision, "\"tp\":");
   if(tpp >= 0) {
      int d = StringFind(decision, ":", tpp);
      string tpStr = "";
      for(int i = d+1; i < StringLen(decision); i++) {
         string ch = StringSubstr(decision, i, 1);
         if((ch >= "0" && ch <= "9")) tpStr += ch;
         else if(StringLen(tpStr) > 0) break;
      }
      if(StringLen(tpStr) > 0) tp = StringToInteger(tpStr);
   }
   return (signal == "BUY" || signal == "SELL" || signal == "HOLD");
}

//+------------------------------------------------------------------+
//| Eksekusi trade sesuai instruksi AI                              |
//+------------------------------------------------------------------+
void ExecuteAITrade(string signal, double confidence, string reasoning, double lot, int sl, int tp)
{
   if(signal != "BUY" && signal != "SELL") {
      Print("[TRADE] Signal bukan BUY/SELL, tidak dieksekusi.");
      return;
   }
   double price = (signal == "BUY") ? SymbolInfoDouble(_Symbol, SYMBOL_ASK) : SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double slPrice = (signal == "BUY") ? price - sl * _Point : price + sl * _Point;
   double tpPrice = (signal == "BUY") ? price + tp * _Point : price - tp * _Point;
   string comment = "ClaudeAI[" + DoubleToString(confidence, 0) + "%]";
   bool result = false;
   if(signal == "BUY") result = trade.Buy(lot, _Symbol, price, slPrice, tpPrice, comment);
   else if(signal == "SELL") result = trade.Sell(lot, _Symbol, price, slPrice, tpPrice, comment);
   if(result) {
      Print("[TRADE SUCCESS] ", signal, " Lot:", lot, " SL:", sl, " TP:", tp, " Price:", price);
   } else {
      Print("[TRADE FAILED] ", signal, " Lot:", lot, " SL:", sl, " TP:", tp, " Price:", price, " | Error: ", trade.ResultRetcodeDescription());
   }
   // Log jumlah posisi terbuka setiap tick
   int openPos = 0;
   for(int i = 0; i < PositionsTotal(); i++) {
      if(positionInfo.SelectByIndex(i)) {
         if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == MagicNumber)
            openPos++;
      }
   }
   Print("[INFO] Open positions for symbol ", _Symbol, ": ", openPos);
}

//+------------------------------------------------------------------+
//| Tutup semua posisi jika AI gagal koneksi                        |
//+------------------------------------------------------------------+
void CloseAllPositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(positionInfo.SelectByIndex(i))
      {
         if(positionInfo.Symbol() == _Symbol && positionInfo.Magic() == MagicNumber)
         {
            bool closeResult = trade.PositionClose(positionInfo.Ticket());
            if(closeResult) {
               Print("[CLOSE ALL SUCCESS] Ticket:", positionInfo.Ticket());
            } else {
               Print("[CLOSE ALL FAILED] Ticket:", positionInfo.Ticket(), " | Error: ", trade.ResultRetcodeDescription());
            }
         }
      }
   }
}
//+------------------------------------------------------------------+
