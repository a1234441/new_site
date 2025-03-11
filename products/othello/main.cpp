#include <iostream>
#include <cstdint>
using namespace std;
bool mode = true;    // true...最強モード   false...最弱モード


#define SIZE 6  // 6x6のボードに変更

struct OthelloboardForBit{
    uint64_t playerBoard;
    uint64_t opponentBoard;
};


int table[64];


const uint8_t outflank[64][6]=
{{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x04,0x00,0x01,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x08,0x00,0x02,0x00,0x00},{0x00,0x08,0x00,0x02,0x00,0x00},{0x08,0x00,0x00,0x01,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x00,0x10,0x00,0x04,0x00},{0x00,0x00,0x10,0x00,0x04,0x00},{0x04,0x00,0x11,0x00,0x04,0x00},{0x00,0x00,0x10,0x00,0x04,0x00},
{0x00,0x10,0x00,0x00,0x02,0x00},{0x00,0x10,0x00,0x00,0x02,0x00},{0x10,0x00,0x00,0x00,0x01,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x00,0x00,0x20,0x00,0x08},{0x00,0x00,0x00,0x20,0x00,0x08},{0x04,0x00,0x01,0x20,0x00,0x08},{0x00,0x00,0x00,0x20,0x00,0x08},
{0x00,0x08,0x00,0x22,0x00,0x08},{0x00,0x08,0x00,0x22,0x00,0x08},{0x08,0x00,0x00,0x21,0x00,0x08},{0x00,0x00,0x00,0x20,0x00,0x08},
{0x00,0x00,0x20,0x00,0x00,0x04},{0x00,0x00,0x20,0x00,0x00,0x04},{0x04,0x00,0x21,0x00,0x00,0x04},{0x00,0x00,0x20,0x00,0x00,0x04},
{0x00,0x20,0x00,0x00,0x00,0x02},{0x00,0x20,0x00,0x00,0x00,0x02},{0x20,0x00,0x00,0x00,0x00,0x01},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x04,0x00,0x01,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x08,0x00,0x02,0x00,0x00},{0x00,0x08,0x00,0x02,0x00,0x00},{0x08,0x00,0x00,0x01,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x00,0x10,0x00,0x04,0x00},{0x00,0x00,0x10,0x00,0x04,0x00},{0x04,0x00,0x11,0x00,0x04,0x00},{0x00,0x00,0x10,0x00,0x04,0x00},
{0x00,0x10,0x00,0x00,0x02,0x00},{0x00,0x10,0x00,0x00,0x02,0x00},{0x10,0x00,0x00,0x00,0x01,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x04,0x00,0x01,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x08,0x00,0x02,0x00,0x00},{0x00,0x08,0x00,0x02,0x00,0x00},{0x08,0x00,0x00,0x01,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x04,0x00,0x01,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00}};


const uint8_t fliplen[64][6]=
{{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x02,0x06,0x0e,0x1e},{0x00,0x00,0x00,0x04,0x0c,0x1c},{0x00,0x00,0x00,0x04,0x0c,0x1c},
{0x02,0x00,0x00,0x00,0x08,0x18},{0x00,0x00,0x00,0x00,0x08,0x18},{0x00,0x00,0x00,0x00,0x08,0x18},{0x00,0x00,0x00,0x00,0x08,0x18},
{0x06,0x04,0x00,0x00,0x00,0x10},{0x00,0x04,0x02,0x00,0x00,0x10},{0x00,0x00,0x00,0x00,0x00,0x10},{0x00,0x00,0x00,0x00,0x00,0x10},
{0x02,0x00,0x00,0x00,0x00,0x10},{0x00,0x00,0x00,0x00,0x00,0x10},{0x00,0x00,0x00,0x00,0x00,0x10},{0x00,0x00,0x00,0x00,0x00,0x10},
{0x0e,0x0c,0x08,0x00,0x00,0x00},{0x00,0x0c,0x0a,0x06,0x00,0x00},{0x00,0x00,0x08,0x04,0x00,0x00},{0x00,0x00,0x08,0x04,0x00,0x00},
{0x02,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x06,0x04,0x00,0x00,0x00,0x00},{0x00,0x04,0x02,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x02,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x1e,0x1c,0x18,0x10,0x00,0x00},{0x00,0x1c,0x1a,0x16,0x0e,0x00},{0x00,0x00,0x18,0x14,0x0c,0x00},{0x00,0x00,0x18,0x14,0x0c,0x00},
{0x02,0x00,0x00,0x10,0x08,0x00},{0x00,0x00,0x00,0x10,0x08,0x00},{0x00,0x00,0x00,0x10,0x08,0x00},{0x00,0x00,0x00,0x10,0x08,0x00},
{0x06,0x04,0x00,0x00,0x00,0x00},{0x00,0x04,0x02,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x02,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x0e,0x0c,0x08,0x00,0x00,0x00},{0x00,0x0c,0x0a,0x06,0x00,0x00},{0x00,0x00,0x08,0x04,0x00,0x00},{0x00,0x00,0x08,0x04,0x00,0x00},
{0x02,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x06,0x04,0x00,0x00,0x00,0x00},{0x00,0x04,0x02,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},
{0x02,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00},{0x00,0x00,0x00,0x00,0x00,0x00}};



const int last_flip_num[64][6]=
{{0,0,0,0,0,0},{0,0,1,2,3,4},{0,0,0,1,2,3},{0,0,0,1,2,3},{1,0,0,0,1,2},{0,0,0,0,1,2},{0,0,0,0,1,2},{0,0,0,0,1,2},
{2,1,0,0,0,1},{0,1,1,0,0,1},{0,0,0,0,0,1},{0,0,0,0,0,1},{1,0,0,0,0,1},{0,0,0,0,0,1},{0,0,0,0,0,1},{0,0,0,0,0,1},
{3,2,1,0,0,0},{0,2,2,2,0,0},{0,0,1,1,0,0},{0,0,1,1,0,0},{1,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},
{2,1,0,0,0,0},{0,1,1,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},{1,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},
{4,3,2,1,0,0},{0,3,3,3,3,0},{0,0,2,2,2,0},{0,0,2,2,2,0},{1,0,0,1,1,0},{0,0,0,1,1,0},{0,0,0,1,1,0},{0,0,0,1,1,0},
{2,1,0,0,0,0},{0,1,1,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},{1,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},
{3,2,1,0,0,0},{0,2,2,2,0,0},{0,0,1,1,0,0},{0,0,1,1,0,0},{1,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},
{2,1,0,0,0,0},{0,1,1,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},{1,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0},{0,0,0,0,0,0}};


const uint8_t d7_rightshift[11] = {0,0,18,12,6,0,1,2,3,0,0};

constexpr uint64_t d7_mask[11] = {
    0ULL, 0ULL, 0x102040000ULL, 0x204081000ULL, 
    0x408102040ULL, 0x810204081ULL, 0x20408102ULL,
    0x810204ULL,0x20408ULL,0ULL,0ULL
};

const uint8_t d5_leftshift[11] =  {0,0,3,2,1,0,0,0,0,0,0};
const uint8_t d5_rightshift[11] = {0,0,0,0,0,0,6,12,18,0,0};
const uint64_t d5_mask[11] = {
    0ULL, 0ULL, 0x1084ULL,0x42108ULL,0x1084210ULL,
    0x42108420ULL,0x84210800ULL, 0x108420000ULL,
    0x210800000ULL,0ULL,0ULL
};
extern "C" {
    //t=x+y
    inline uint8_t change_5line(uint64_t index,int t){
        index &= d5_mask[t];
        index<<=d5_leftshift[t];
        index>>=d5_rightshift[t];
        return static_cast<uint8_t>((((index*0x2220ULL)&0xE00000000ULL) | ((index*0x2220000ULL)&0x1C0000000ULL))>>30);
    }

    //t=x+5-y
    inline uint8_t change_7line(uint64_t index,int t){
        index &= d7_mask[t];
        index>>=d7_rightshift[t];
        return static_cast<uint8_t>(((index*0x41041041ULL)&0xFC0000000ULL)>>30);
    }

    //下から数えて何ビット目かを引数に入力
    //t=y
    inline uint8_t change_rline(uint64_t index,int t){
        return static_cast<uint8_t>(((index<<((5-t)*6))&0xFC0000000ULL)>>30);
    }

    //下から数えて何ビット目かを引数に入力
    //t=x
    inline uint8_t change_cline(uint64_t index,int t){
        index= 0x41041041 & (index >> t);
        return static_cast<uint8_t>(((index*0x42108420ULL)&0xFC0000000ULL)>>30);
    }

    //下から数えて何ビット目かを引数に入力(0~35)
    //t=x+y
    inline uint64_t dechange_5line(uint8_t index,int t){
        uint64_t index1=(((index&0x38ULL)*0x2220000ULL)|((index&0x7ULL)*0x2220ULL))&0x42108420ULL;
        index1<<=d5_rightshift[t];
        index1>>=d5_leftshift[t];
        index1&=d5_mask[t];
        return index1;
    }

    //t=x+5-y
    inline uint64_t dechange_7line(uint8_t index,int t){
        uint64_t index1=((index&0x3FULL)*0x41041041ULL)&0x810204081ULL;
        index1<<=d7_rightshift[t];
        index1&=d7_mask[t];
        return index1;
    }


    //t=y
    inline uint64_t dechange_rline(uint8_t index,int t){
        return (index&0x3FULL)<<(6*t);
    }

    //下から数えて何ビット目かを引数に入力
    //t=x
    inline uint64_t dechange_cline(uint8_t index,int t){
        uint64_t index1 =(((index&0x38ULL)*0x2108000ULL)|((index&0x7ULL)*0x421ULL))&0x41041041ULL;
        return index1<<t;
    }


    int CountBit(uint64_t board){
        board = board - ((board >> 1) & 0x5555555555555555); 
        board = (board & 0x3333333333333333)+ ((board >> 2) & 0x3333333333333333)  ;
        board = (board + (board >> 4)) & 0x0f0f0f0f0f0f0f0f;
        board = board + (board >> 8);
        board = board + (board >> 16);
        board = board + (board >> 32);
        return board & 0x0000007f;
    }


    uint64_t int_to_16(int position) {
        // positionは1から64の範囲と仮定
        if (position < 1 || position > SIZE*SIZE) {
            std::cerr << "Invalid position!" << std::endl;
            return 0;
        }
        return 1ULL << (SIZE*SIZE-position);  
    }

    void InitializeTable() {
        uint64_t hash = 0x03F566ED27179461ULL;
        for (int i = 0; i < 64; i++) {
            table[hash >> 58] = i;
            hash <<= 1;
        }
    }

    int GetNumberZeros(int64_t x) {
        if (x == 0) return 64;

        uint64_t y = static_cast<uint64_t>(x & -x); // 最も右の1ビットのみを抽出
        int i = static_cast<int>((y * 0x03F566ED27179461ULL) >> 58);
        return table[i];
    }
    
    uint64_t makeLegalBoard(uint64_t p,uint64_t o) {

        uint64_t colmask= o & 0x000000079E79E79E; 
        uint64_t rowmask= o & 0x000000003FFFFFC0;
        uint64_t allsidemask= o & 0x000000001E79E780; 
        uint64_t legalBoard,tmp;


        // 各方向の合法手を計算 (左, 右, 上, 下, 斜め)
        tmp = colmask & (p << 1);//左
        legalBoard = colmask+tmp;

        tmp = colmask & (p >> 1);
        tmp |= colmask & (tmp >> 1);
        tmp |= colmask & (tmp >> 1);
        tmp |= colmask & (tmp >> 1);
        legalBoard |= tmp >> 1;

        tmp = rowmask & (p << 6);
        tmp |= rowmask & (tmp << 6);
        tmp |= rowmask & (tmp << 6);
        tmp |= rowmask & (tmp << 6);
        legalBoard |= tmp << 6;

        tmp = rowmask & (p >> 6);
        tmp |= rowmask & (tmp >> 6);
        tmp |= rowmask & (tmp >> 6);
        tmp |= rowmask & (tmp >> 6);
        legalBoard |= tmp >> 6;

        tmp = allsidemask & (p << 5);
        tmp |= allsidemask & (tmp << 5);
        tmp |= allsidemask & (tmp << 5);
        tmp |= allsidemask & (tmp << 5);
        legalBoard |= tmp << 5;

        tmp = allsidemask & (p << 7);
        tmp |= allsidemask & (tmp << 7);
        tmp |= allsidemask & (tmp << 7);
        tmp |= allsidemask & (tmp << 7);
        legalBoard |= tmp << 7;

        tmp = allsidemask & (p >> 7);
        tmp |= allsidemask & (tmp >> 7);
        tmp |= allsidemask & (tmp >> 7);
        tmp |= allsidemask & (tmp >> 7);
        legalBoard |= tmp >> 7;

        tmp = allsidemask & (p >> 5);
        tmp |= allsidemask & (tmp >> 5);
        tmp |= allsidemask & (tmp >> 5);
        tmp |= allsidemask & (tmp >> 5);
        legalBoard |= tmp >> 5;

        legalBoard&=~(p | o);
        return legalBoard;
    }

    OthelloboardForBit putStone(OthelloboardForBit b, uint64_t position) {
        b.playerBoard |= position; // プレイヤーの石を置く
        uint64_t colmask = b.opponentBoard & 0x000000079E79E79E;
        uint64_t rowmask = b.opponentBoard & 0x000000003FFFFFC0;
        uint64_t allsidemask = b.opponentBoard & 0x000000001E79E780;
        uint64_t board = b.playerBoard;
        uint64_t rev = 0;  // 反転させる石を保存する変数
        uint64_t tmp;
        //displaylegal(b.playerBoard);
        // 左方向
        tmp = colmask & (position << 1);
        tmp |= colmask & (tmp << 1);
        tmp |= colmask & (tmp << 1);
        tmp |= colmask & (tmp << 1);
        if ((tmp << 1) & board) rev |= tmp;
        //rev |= (tmp&-(int)((b.playerBoard & (tmp << 1))!=0));

        // 右方向
        tmp = colmask & (position >> 1);
        tmp |= colmask & (tmp >> 1);
        tmp |= colmask & (tmp >> 1);
        tmp |= colmask & (tmp >> 1);
        if ((tmp >> 1) & board) rev |= tmp;

        // 上方向
        tmp = rowmask & (position << 6);
        tmp |= rowmask & (tmp << 6);
        tmp |= rowmask & (tmp << 6);
        tmp |= rowmask & (tmp << 6);
        if ((tmp << 6) & board) rev |= tmp;

        // 下方向
        tmp = rowmask & (position >> 6);
        tmp |= rowmask & (tmp >> 6);
        tmp |= rowmask & (tmp >> 6);
        tmp |= rowmask & (tmp >> 6);
        if ((tmp >> 6) & board) rev |= tmp;

        // 左上方向
        tmp = allsidemask & (position << 5);
        tmp |= allsidemask & (tmp << 5);
        tmp |= allsidemask & (tmp << 5);
        tmp |= allsidemask & (tmp << 5);
        if ((tmp << 5) & board) rev |= tmp;

        // 右上方向
        tmp = allsidemask & (position << 7);
        tmp |= allsidemask & (tmp << 7);
        tmp |= allsidemask & (tmp << 7);
        tmp |= allsidemask & (tmp << 7);
        if ((tmp << 7) & board) rev |= tmp;

        // 左下方向
        tmp = allsidemask & (position >> 7);
        tmp |= allsidemask & (tmp >> 7);
        tmp |= allsidemask & (tmp >> 7);
        tmp |= allsidemask & (tmp >> 7);
        if ((tmp >> 7) & board) rev |= tmp;

        // 右下方向
        tmp = allsidemask & (position >> 5);
        tmp |= allsidemask & (tmp >> 5);
        tmp |= allsidemask & (tmp >> 5);
        tmp |= allsidemask & (tmp >> 5);
        if ((tmp >> 5) & board) rev |= tmp;

        b.playerBoard ^= rev;  // プレイヤーのボードに反転を適用
        b.opponentBoard ^= rev;  // 相手のボードに反転を適用
        tmp=b.playerBoard;
        b.playerBoard=b.opponentBoard;
        b.opponentBoard=tmp;
        return b;
    }



    OthelloboardForBit change_only_turn(OthelloboardForBit b){//パスするときはこれを使う
        uint64_t tmp=b.playerBoard;
        b.playerBoard=b.opponentBoard;
        b.opponentBoard=tmp;
        return b;
    }



    inline int evaluate(OthelloboardForBit b){
    int playerscore = CountBit(b.playerBoard);
    int opponentscore = CountBit(b.opponentBoard);
    int count=playerscore-opponentscore;
    if(playerscore==0)count=-SIZE*SIZE*2+opponentscore;
    if(opponentscore==0)count=SIZE*SIZE*2-playerscore;
    if(mode==false) count=-count;
    return count;
    }

    int last_evaluate1(OthelloboardForBit b,int position,bool change){
        int x=position%6;
        int y=position/6;
        int score=last_flip_num[change_5line(b.playerBoard,x+y)][min(5-x,y)]+
            last_flip_num[change_7line(b.playerBoard,x+5-y)][min(x,y)]+
            last_flip_num[change_rline(b.playerBoard,y)][x]+
            last_flip_num[change_cline(b.playerBoard,x)][y];
        if(score==0){
            if(change) {
                int playerscore = CountBit(b.playerBoard);
                int opponentscore = CountBit(b.opponentBoard);
                int count=playerscore-opponentscore;
                if(playerscore==0)count=-SIZE*SIZE*2+opponentscore;
                if(opponentscore==0)count=SIZE*SIZE*2-playerscore;
                if(mode==false) count=-count;
                return count;
            }
            else {
                b=change_only_turn(b);
                return -last_evaluate1(b,position,true);
            }
        }
        int playerscore = CountBit(b.playerBoard);
        int opponentscore = CountBit(b.opponentBoard);
        int count=playerscore-opponentscore+2*score+1;
        if(playerscore==0)count=-SIZE*SIZE*2+opponentscore;
        if(opponentscore==0)count=SIZE*SIZE*2-playerscore;
        if(mode==false) count=-count;

        return count;
    }





    //単純に一番下のマスから探索する方法
    int Nega_alpha(OthelloboardForBit b, int depth, bool passed, int alpha, int beta) {

        if (CountBit(~(0xFFFFFFF000000000|b.playerBoard|b.opponentBoard)) == 1)
            return last_evaluate1(b,GetNumberZeros(~(0xFFFFFFF000000000|b.playerBoard|b.opponentBoard)),false);
        if (depth == 0)
            return evaluate(b);      

        int  g, max_score = -10000;
        uint64_t legalMoves = makeLegalBoard(b.playerBoard,b.opponentBoard);
        //displaylegal(legalMoves);
        for(uint64_t j=legalMoves;j!=0;j&=j-1){
            uint64_t bitposition=j& (~j + 1);
            g = -Nega_alpha(putStone(b,bitposition), depth - 1, false, -beta, -alpha);
            if (g >= beta) 
                return g;
            alpha = max(alpha, g);
            max_score = max(max_score, g);
        }

        // パスの処理 手番を交代して同じ深さで再帰する
        if (max_score == -10000) {
            if (passed)// 2回連続パスなら評価関数を実行
                return evaluate(b);
            return -Nega_alpha(change_only_turn(b), depth, true, -beta, -alpha);
        }
        return max_score;
    }





    int Search(uint64_t p,uint64_t o,int depth,int mode1) {//mode1=1最強　-1　雑魚
        if(mode1==1) mode=true;
        else mode=false;
        InitializeTable();
        OthelloboardForBit b;
        b.playerBoard=p;
        b.opponentBoard=o;
        int coord, res = -1, score, alpha = -10000, beta = 10000;
        uint64_t legalMoves = makeLegalBoard(b.playerBoard,b.opponentBoard);//自分のボードを入れる(白)
        for(uint64_t i=legalMoves;i!=0;i&=i-1){
            coord = SIZE*SIZE - GetNumberZeros(i);
            uint64_t bitposition=i&(~i+1);
            score = -Nega_alpha(putStone(b,bitposition), depth - 1, false, -beta, -alpha);
            if (alpha < score) {
                alpha = score;  // 評価の最大値
                res = coord;
            }
        }
        return res;
    }
}
