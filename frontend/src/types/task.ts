export type Task = {
  id : string ;
  userId : string ;
  title : string ;
  description : string ;
  completed : boolean ;
  importance : number ;
  cost : number ;
  tags : string[] ;
  createdAt : string ;
  updatedAt : string ;
}